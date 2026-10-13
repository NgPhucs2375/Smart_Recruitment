import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const password = process.env.JOB_SMOKE_PASSWORD;
if (!password) throw new Error("Set JOB_SMOKE_PASSWORD for the existing seeded accounts.");
const base = process.env.JOB_SMOKE_BASE_URL || "http://127.0.0.1:8000/api";
const marker = `job-smoke-${Date.now()}`;
const jobs = [], cvs = [], connections = [];
const val = (o, k) => o?.[k] ?? o?.[k[0].toUpperCase() + k.slice(1)];
const sql = query => execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
async function call(token, path, method = "GET", body) {
  const form = body instanceof FormData;
  const response = await fetch(base + path, { method, headers: { ...(form ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: form ? body : JSON.stringify(body) } : {}) });
  const result = await response.json();
  return { status: response.status, value: val(result, "data"), raw: result, ok: response.ok && val(result, "succeeded") !== false };
}
async function ok(token, path, method = "GET", body) { const r = await call(token, path, method, body); assert(r.ok, `${path}: ${r.status} ${val(r.raw, "message") ?? ""}`); return r.value ?? r.raw; }
async function login(email) { const r = await ok(null, "/account/authenticate", "POST", { email, password }); return { token: r.JWToken ?? r.jwToken, id: val(r, "id") }; }
const check = (condition, label) => { assert(condition, label); console.log(`PASS ${label}`); };
try {
  const owner = await login("daidien.saokhue@seed.local"), candidate = await login("ungvien.mai@seed.local");
  const company = Number(sql(`SELECT h."DoanhNghiepId" FROM "HoSoNhaTuyenDung" h JOIN "NguoiDung" n ON n."Id"=h."NguoiDungId" WHERE n."ApplicationUserId"='${owner.id}'`));
  const hr = await login(`nhansu.dn${company}.01@seed.local`);
  const options = await ok(candidate.token, "/tintuyendungs/filter-options");
  const categories = val(options, "categories"), skills = val(options, "skills");
  const category = Number(val(categories[0], "id")), firstSkill = Number(val(skills[0], "id")), secondSkill = Number(val(skills[1], "id"));
  const content = { danhMucNgheId: category, tieuDe: `${marker} Senior Backend`, moTaCongViec: "Design reliable software, collaborate with engineering, write tests, review implementations and document technical decisions. ".repeat(5), yeuCauCongViec: "Experience in software development and version control. ".repeat(3), diaDiemLamViec: "Ha Noi", luongToiThieu: 10000000, luongToiDa: 20000000, ngayHetHan: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), kyNangs: [{ kyNangId: firstSkill, mucDoYeuCau: 2 }, { kyNangId: secondSkill, mucDoYeuCau: 1 }] };
  async function makeJob(suffix) {
    const id = Number(await ok(owner.token, "/tintuyendungs", "POST", { ...content, tieuDe: `${content.tieuDe} ${suffix}` })); jobs.push(id);
    await ok(owner.token, `/tintuyendungs/${id}/fire`, "POST", { id, trigger: 0, ghiChu: "Application smoke test" }); return id;
  }
  const job = await makeJob("A"), another = await makeJob("B");
  const query = `_filter=${marker}&DanhMucNgheId=${category}&KyNangIds=${firstSkill}&KyNangIds=${secondSkill}&MatchAllSkills=true&Location=ha%20noi&SalaryMin=15000000&Level=Senior&EmploymentType=Full-time&_start=0&_end=1`;
  const filtered = await call(candidate.token, `/tintuyendungs?${query}`);
  check(filtered.ok && filtered.value.length === 1 && Number(val(filtered.raw, "totalCount")) === 2, "Real SQL combined industry/skills/location/salary/level filters and paging");
  check((await ok(candidate.token, `/tintuyendungs?${query.replace("SalaryMin=15000000", "SalaryMin=30000000")}`)).length === 0, "Salary filter excludes non-overlapping jobs");
  const profile = await ok(candidate.token, "/hosoungviens/cua-toi");
  async function makeCv(suffix) {
    const payload = { hoSoUngVienId: val(profile, "id"), tenFile: `${marker} CV ${suffix}`, templateId: "minimal-ats", templateVersion: "1.0", isDefault: false, phuongThucTao: 1,
      noiDung: { thongTinLienHe: { hoTen: "Submitted original name", email: "test@example.invalid", sdt: "0901234567", diaChi: "Ha Noi", viTriUngTuyen: "Backend Engineer" }, hocVan: [], kinhNghiemLamViec: [], duAn: [], kyNang: [], chungChi: [] } };
    const form = new FormData(); form.append("Payload", JSON.stringify(payload));
    const saved = await ok(candidate.token, "/cvungviens/save-version", "POST", form);
    const id = Number(saved.CVUngVienId ?? saved.cvUngVienId); cvs.push(id); return { id, payload };
  }
  const cv = await makeCv("A"), otherCv = await makeCv("B");
  check(!(await call(owner.token, "/donungtuyens", "POST", { TinTuyenDungId: job, CVUngVienId: cv.id })).ok, "Recruiter cannot apply using candidate CV");
  // Observe actual SignalR notifications, not only database rows.
  const require = createRequire(new URL("../../src/WebApi/frontend/package.json", import.meta.url));
  const signalr = require("@microsoft/signalr");
  const events = [];
  const connection = new signalr.HubConnectionBuilder().withUrl(`${base}/hubs/notifications`, { accessTokenFactory: () => candidate.token }).configureLogging(signalr.LogLevel.Error).build();
  connections.push(connection); connection.on("ReceiveNotification", payload => { events.push(payload); }); await connection.start();
  const results = await Promise.all([call(candidate.token, "/donungtuyens", "POST", { TinTuyenDungId: job, CVUngVienId: cv.id }), call(candidate.token, "/donungtuyens", "POST", { TinTuyenDungId: job, CVUngVienId: otherCv.id })]);
  check(results.filter(r => r.ok).length === 1, "Concurrent different-CV applications produce exactly one candidate/job record");
  const application = Number(results.find(r => r.ok).value);
  await new Promise(r => setTimeout(r, 300));
  check(events.some(e => Number(e.ReferenceId ?? e.referenceId) === application && Number(e.Id ?? e.id) > 0), "Persisted application notification is received through real SignalR");
  const edited = new FormData(); edited.append("Payload", JSON.stringify({ ...cv.payload, CVUngVienId: cv.id, noiDung: { ...cv.payload.noiDung, thongTinLienHe: { ...cv.payload.noiDung.thongTinLienHe, hoTen: "Edited later" } } }));
  await ok(candidate.token, "/cvungviens/save-version", "POST", edited);
  const detail = await ok(owner.token, `/donungtuyens/show/${application}`);
  const snapshot = val(detail, "cvDaNop");
  check(val(val(val(snapshot, "noiDung"), "thongTinLienHe"), "hoTen") === "Submitted original name", "Real database CV snapshot remains unchanged after editing current CV");
  await ok(owner.token, `/donungtuyens/${application}`, "PUT", { id: application, trigger: 5, ghiChu: "Viewed" });
  await ok(owner.token, `/donungtuyens/${application}`, "PUT", { id: application, trigger: 6, ghiChu: "Skills match" });
  const history = await ok(candidate.token, `/donungtuyens?TinTuyenDungId=${job}`);
  check(["5", "phuhop"].includes(String(val(history[0], "trangThai")).toLowerCase()), "Candidate sees recruiter assessment status");
  await ok(candidate.token, `/donungtuyens/${application}`, "PUT", { id: application, trigger: 8, ghiChu: "Withdraw smoke application" });
  const withdrawn = await ok(candidate.token, `/donungtuyens?TinTuyenDungId=${job}`);
  check(["4", "ungvienrutdon"].includes(String(val(withdrawn[0], "trangThai")).toLowerCase()), "Withdrawn application remains in real tracking history");
  console.log("Job search/application Docker smoke checks completed.");
} finally {
  for (const connection of connections) await connection.stop().catch(() => {});
  if (jobs.length) sql(`BEGIN; DELETE FROM "Notifications" WHERE ("ReferenceType"='DonUngTuyen' AND "ReferenceId" IN (SELECT "Id" FROM "DonUngTuyen" WHERE "TinTuyenDungId" IN (${jobs.join(",")}))) OR ("ReferenceType"='TinTuyenDung' AND "ReferenceId" IN (${jobs.join(",")})); DELETE FROM "DanhGia" WHERE "DonUngTuyenId" IN (SELECT "Id" FROM "DonUngTuyen" WHERE "TinTuyenDungId" IN (${jobs.join(",")})); DELETE FROM "DonUngTuyen" WHERE "TinTuyenDungId" IN (${jobs.join(",")}); DELETE FROM "KyNangTinTuyenDung" WHERE "TinTuyenDungId" IN (${jobs.join(",")}); DELETE FROM "TinTuyenDung" WHERE "Id" IN (${jobs.join(",")}) AND "TieuDe" LIKE '${marker}%'; COMMIT;`);
  if (cvs.length) sql(`DELETE FROM "CVUngVien" WHERE "Id" IN (${cvs.join(",")}) AND "TenFile" LIKE '${marker}%';`);
  console.log("Cleaned smoke-test jobs, applications, CVs and notifications.");
}
