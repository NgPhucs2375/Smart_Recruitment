import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
const password = process.env.AUTH_SMOKE_PASSWORD;
if (!password) throw new Error("Set AUTH_SMOKE_PASSWORD for local seed accounts.");
const base = process.env.AUTH_SMOKE_BASE_URL || "http://127.0.0.1:8000/api";
const manifest = JSON.parse(await readFile(new URL("../../src/WebApi/frontend/features/tao-cv/template-manifest.json", import.meta.url), "utf8"));
const field = (o, k) => o?.[k] ?? o?.[k[0].toUpperCase() + k.slice(1)];
const sql = query => execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db", "-t", "-A", "-c", query], { encoding: "utf8" }).trim();
async function request(path, token, body) {
  const res = await fetch(base + path, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
  const result = await res.json(); return { status: res.status, body: result, data: field(result, "data") };
}
let ready = false;
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(base.replace(/\/api$/, "") + "/swagger/index.html", { signal: AbortSignal.timeout(3000) })).ok) { ready = true; break; } } catch { }
  await new Promise(r => setTimeout(r, 3000));
}
assert(ready, "Backend startup timeout");
const login = await request("/account/authenticate", null, { email: "basicuser@gmail.com", password }); assert.equal(login.status, 200);
const token = login.data.JWToken ?? login.data.jwToken;
const uid = field(login.data, "id"); assert(/^[\w-]+$/.test(uid));
const active = await request("/cvthemes/active", null); assert.equal(active.status, 200);
const activeSlugs = active.data.map(t => field(t, "slug"));
// DB là nguồn chân lý: mẫu render được nếu có renderer tĩnh trong manifest
// HOẶC có CauHinhJson ThemeCanvas (registerStudioEntry đăng ký động khi nạp app).
const dbRows = new Map(sql(`SELECT "Slug", ("CauHinhJson" IS NOT NULL AND "CauHinhJson" <> ''), "SoCot" FROM cv_themes`)
  .split("\n").map(l => l.split("|")).map(r => [r[0], { config: r[1] === "t", columns: Number(r[2]) }]));
const renderable = slug => Boolean(manifest[slug]) || Boolean(dbRows.get(slug)?.config);
for (const criteria of [
  { ViTri: "Backend Developer", Nganh: "IT", CapBac: "junior", PhongCach: "tối giản", SoCot: 1, BatBuocATS: true },
  { ViTri: "Data Analyst", Nganh: "Data", CapBac: "mid" },
  { ViTri: "Điều dưỡng", Nganh: "Y tế", CapBac: "junior" },
  { ViTri: "Finance", Nganh: "Tài chính", CapBac: "senior" },
]) {
  const result = await request("/cvthemes/suggest", token, { ...criteria, UseSavedCv: false, TopN: 3 });
  assert.equal(result.status, 200); assert(Array.isArray(result.data) && result.data.length > 0 && result.data.length <= 3);
  for (const theme of result.data) {
    const slug = field(theme, "slug");
    assert(renderable(slug) && activeSlugs.includes(slug), `recommendation ${slug} must be active and renderable`);
    assert.equal(field(theme, "templateVersion"), manifest[slug] ? manifest[slug].version : "1.0");
    assert.equal(field(theme, "soCot"), manifest[slug] ? manifest[slug].columns : dbRows.get(slug).columns);
    assert.equal(field(theme, "matchingVersion"), "theme-v2");
    assert(field(theme, "lyDo"));
    if (criteria.SoCot) assert.equal(field(theme, "soCot"), criteria.SoCot);
    if (criteria.BatBuocATS) assert.equal(field(theme, "thanThienATS"), true);
  }
  console.log(`PASS live ${criteria.ViTri}/${criteria.CapBac}: active, renderable, versioned recommendations`);
}
assert.equal((await request("/cvthemes/suggest", null, { ViTri: "Backend" })).status, 401);
assert.equal((await request("/cvthemes/suggest", token, { SoCot: 3 })).status, 400);
assert.equal((await request("/cvthemes/suggest", token, { CapBac: "junior senior" })).status, 400);
const foreign = Number(sql(`SELECT c."Id" FROM "CVUngVien" c JOIN "HoSoUngVien" h ON h."Id"=c."HoSoUngVienId" JOIN "NguoiDung" n ON n."Id"=h."NguoiDungId" WHERE n."ApplicationUserId"<>'${uid}' AND NOT c."IsDaXoa" ORDER BY c."Id" LIMIT 1`));
assert(foreign > 0); assert.equal((await request("/cvthemes/suggest", token, { CvUngVienId: foreign })).status, 403);
const blank = await request("/cvthemes/suggest", token, { UseSavedCv: false });
assert.equal(blank.status, 200); assert(blank.data.every(t => field(t, "viTri") === "" && field(t, "canhBao").some(w => w.includes("Chưa biết"))));
console.log("PASS anonymous/invalid/foreign-CV requests rejected; blank draft does not inherit stored profile");
const unrenderable = activeSlugs.filter(slug => !renderable(slug)).sort();
assert.deepEqual(unrenderable, ["elegant-serif"], "chỉ mẫu chủ động retire mới được phép không có bản render");
console.log(`PASS catalog lint: ${activeSlugs.length} mẫu active, ${unrenderable.length} mẫu không render được (${unrenderable.join(", ") || "không có"})`);
if (process.env.CV_THEME_SMOKE_AGENT === "1") {
  const ask = async content => {
    const res = await fetch(base + "/copilotkit", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ threadId: randomUUID(), runId: randomUUID(), state: {}, tools: [], context: [], forwardedProps: {}, messages: [{ id: randomUUID(), role: "user", content }] }), signal: AbortSignal.timeout(120000) });
    assert.equal(res.status, 200);
    const text = await res.text();
    assert(!text.includes('"type":"RUN_ERROR"'), `Agent run failed. Stream: ${text.slice(0, 2400)}`);
    return text;
  };
  const criteriaRun = await ask("Gợi ý mẫu CV cho công việc Backend Developer junior, ngành IT, bắt buộc một cột và ATS. Chỉ gợi ý và giải thích, chưa áp dụng.");
  assert(["suggest_cv_theme", "get_cv_theme_workspace"].some(n => criteriaRun.includes(n)), `Agent must call a real theme tool. Stream: ${criteriaRun.slice(0, 2400)}`);
  assert(criteriaRun.includes("theme-v2") || criteriaRun.includes("theme-agent-v1"), "Tool result must be a real matcher or agent-validated response");
  console.log("PASS live natural-language agent answers a criteria-only request");
  const cvRun = await ask("Dựa đúng vào CV tôi đang lưu, hãy tự đọc danh mục mẫu trong hệ thống rồi chọn mẫu phù hợp nhất và giải thích vì sao. Chỉ gợi ý, chưa đổi mẫu.");
  assert(cvRun.includes("get_cv_theme_workspace"), "Agent phải xuống DB đọc danh mục mẫu + tóm tắt CV trước khi quyết định");
  assert(cvRun.includes("pick_cv_themes"), "Agent phải trình quyết định cho server kiểm định");
  assert(cvRun.includes("theme-agent-v1"), "Kết quả được kiểm định phải gắn nhãn luồng agent");
  console.log("PASS multi-step agent: doc workspace tu DB -> model chon -> pick_cv_themes kiem dinh (theme-agent-v1)");
}
