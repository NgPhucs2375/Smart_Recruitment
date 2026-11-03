import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const password = process.env.CV_TRASH_SMOKE_PASSWORD;
if (!password) throw new Error("Set CV_TRASH_SMOKE_PASSWORD for the seeded candidate accounts.");
const base = process.env.CV_TRASH_SMOKE_BASE_URL || "http://127.0.0.1:8000/api";
const marker = `cv-trash-smoke-${Date.now()}`;
const cvs = [];
const val = (o, k) => o?.[k] ?? o?.[k[0].toUpperCase() + k.slice(1)];
const sql = query => execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
async function call(token, path, method = "GET", body) {
  const form = body instanceof FormData;
  const response = await fetch(base + path, { method, headers: { ...(form ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: form ? body : JSON.stringify(body) } : {}) });
  const result = await response.json();
  return { status: response.status, value: val(result, "data"), message: val(result, "message"), raw: result, ok: response.ok && val(result, "succeeded") !== false };
}
async function ok(token, path, method = "GET", body) { const r = await call(token, path, method, body); assert(r.ok, `${path}: ${r.status} ${r.message ?? ""}`); return r.value ?? r.raw; }
async function login(email) { const r = await ok(null, "/account/authenticate", "POST", { email, password }); return val(r, "jwToken") ?? r.JWToken ?? r.jwToken; }
const check = (condition, label) => { assert(condition, label); console.log(`PASS ${label}`); };
const ids = list => list.map(x => Number(val(x, "id"))).sort((a, b) => a - b);

let profileId = 0, defaultBefore = 0;
try {
  const owner = await login("ungvien.mai@seed.local"), intruder = await login("ungvien.hung@seed.local"), admin = await login("superadmin@gmail.com");
  profileId = Number(val(await ok(owner, "/hosoungviens/cua-toi"), "id"));

  async function makeCv(suffix) {
    const payload = { hoSoUngVienId: profileId, tenFile: `${marker} CV ${suffix}`, templateId: "minimal-ats", templateVersion: "1.0", isDefault: false, phuongThucTao: 1,
      noiDung: { thongTinLienHe: { hoTen: "Trash restore probe", email: "probe@example.invalid", sdt: "0900000000", diaChi: "Ha Noi", viTriUngTuyen: "Backend Engineer" }, hocVan: [], kinhNghiemLamViec: [], duAn: [], kyNang: [], chungChi: [] } };
    const form = new FormData(); form.append("Payload", JSON.stringify(payload));
    const saved = await ok(owner, "/cvungviens/save-version", "POST", form);
    const id = Number(saved.CVUngVienId ?? saved.cvUngVienId);
    cvs.push(id); return id;
  }
  const live = async () => ids(await ok(owner, `/cvungviens?_start=0&_end=50&HoSoUngVienId=${profileId}`));
  const trash = async () => ids(await ok(owner, "/cvungviens/thung-rac"));
  // Cờ default đọc thẳng từ bảng CV: kiểm chứng trên dữ liệu thật, không qua cache danh sách.
  const defaultHolder = () => Number(sql(`SELECT COALESCE((SELECT "Id" FROM "CVUngVien" WHERE "HoSoUngVienId"=${profileId} AND "IsDefault" AND NOT "IsDaXoa" LIMIT 1),0)`));
  const otherLiveDefaults = id => Number(sql(`SELECT count(*) FROM "CVUngVien" WHERE "HoSoUngVienId"=${profileId} AND "Id"<>${id} AND "IsDefault" AND NOT "IsDaXoa"`));

  defaultBefore = defaultHolder();
  const cv1 = await makeCv("A"), cv2 = await makeCv("B");
  check((await live()).includes(cv1) && (await live()).includes(cv2), "Probe CVs appear in the live CV list");
  check(!(await trash()).some(id => [cv1, cv2].includes(id)), "Trash holds no live CV");

  await ok(owner, `/cvungviens/${cv1}/set-default`, "POST", { id: cv1 });
  check(defaultHolder() === cv1, "Probe CV can take the profile default");
  await ok(owner, `/cvungviens/${cv1}`, "DELETE");
  check((await trash()).includes(cv1) && !(await live()).includes(cv1), "Soft delete moves the CV from the live list into the trash");
  check(!(await call(owner, `/cvungviens/show/${cv1}`)).ok, "Deleted CV detail stays closed");
  const promoted = defaultHolder();
  check(promoted !== 0 && promoted !== cv1, "Deleting the default CV promotes another live CV");
  const deletedItem = (await ok(owner, "/cvungviens/thung-rac")).find(c => Number(val(c, "id")) === cv1);
  check(val(deletedItem, "tenFile").startsWith(marker) && !!val(deletedItem, "ngayXoa"), "Trash row carries the CV name and delete timestamp");

  check(!(await call(owner, `/cvungviens/${cv2}/khoi-phuc`, "POST", {})).ok, "Restore refuses a CV that is not in the trash");
  check(!(await call(intruder, `/cvungviens/${cv1}/khoi-phuc`, "POST", {})).ok, "Another candidate cannot restore the CV by guessing its ID");
  check(!(await ok(intruder, "/cvungviens/thung-rac")).some(c => Number(val(c, "id")) === cv1), "Another candidate's trash never leaks the owner's deleted CV");
  check(!(await call(admin, `/cvungviens/${cv1}/khoi-phuc`, "POST", {})).ok, "Admin does not restore CVs on behalf of a candidate");

  await ok(owner, `/cvungviens/${cv1}/khoi-phuc`, "POST", {});
  check((await live()).includes(cv1) && !(await trash()).includes(cv1), "Owner restore returns the CV to the live list and empties its trash row");
  check((await call(owner, `/cvungviens/show/${cv1}`)).ok, "Restored CV detail opens again");
  check(defaultHolder() === promoted, "Restored CV does not steal the default from the CV in use");

  await ok(owner, `/cvungviens/${cv1}`, "DELETE");
  await ok(owner, `/cvungviens/${cv2}`, "DELETE");
  check((await trash()).includes(cv1) && (await trash()).includes(cv2) && !(await live()).some(id => [cv1, cv2].includes(id)), `Deleting both probe CVs leaves them recoverable in the trash (live=${JSON.stringify(await live())} trash=${JSON.stringify(await trash())})`);

  await ok(owner, `/cvungviens/${cv2}/khoi-phuc`, "POST", {});
  check((defaultHolder() === cv2) === (otherLiveDefaults(cv2) === 0), `Restored CV takes the default exactly when no live CV holds it (holder=${defaultHolder()})`);
  check(!!(await ok(owner, `/cvungviens/show/${cv2}`)), "Restored CV keeps its saved content");
  console.log("CV trash/restore Docker smoke checks completed.");
} finally {
  if (cvs.length) sql(`DELETE FROM "CVUngVien" WHERE "Id" IN (${cvs.join(",")}) AND "TenFile" LIKE '${marker}%';`);
  if (profileId && defaultBefore) sql(`UPDATE "CVUngVien" SET "IsDefault"=("Id"=${defaultBefore}) WHERE "HoSoUngVienId"=${profileId} AND NOT "IsDaXoa";`);
  console.log(`Cleaned probe CVs ${cvs.join(", ") || "none"}; profile default CV restored to ${defaultBefore || "unchanged"}.`);
}
