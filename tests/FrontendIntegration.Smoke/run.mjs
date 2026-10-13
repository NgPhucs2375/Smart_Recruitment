import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const password = process.env.INTEGRATION_SMOKE_PASSWORD;
if (!password) throw new Error("Set INTEGRATION_SMOKE_PASSWORD for seeded accounts.");
const origin = process.env.INTEGRATION_SMOKE_ORIGIN || "http://127.0.0.1:8000";
const marker = `integration-smoke-${Date.now()}`;
const sql = query => execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
const field = (o, k) => o?.[k] ?? o?.[k[0].toUpperCase() + k.slice(1)];
async function call(token, path, method = "GET", body) {
  const response = await fetch(origin + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await response.text();
  const result = text ? JSON.parse(text) : null;
  assert(response.ok && field(result, "succeeded") !== false, `${path}: ${response.status} ${field(result, "message") ?? ""}`);
  return result;
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${origin}/swagger/index.html`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Dev container may still be compiling after restart. */ }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  assert(ready, "Backend did not become ready after container startup.");
  const swagger = await call(null, "/swagger/v1/swagger.json");
  const paths = Object.keys(swagger.paths).map(path => path.toLowerCase());
  const expected = ["/api/account/authenticate", "/api/account/register", "/api/account/change-password", "/api/account/forgot-password", "/api/account/reset-password", "/api/account/resend-verification-email", "/api/account/me", "/api/tintuyendungs", "/api/tintuyendungs/filter-options", "/api/tintuyendungs/show/{id}", "/api/donungtuyens", "/api/donungtuyens/show/{id}", "/api/cvungviens/save-version", "/api/hosoungviens/cua-toi", "/api/hosonhatuyendungs/mine", "/api/doanhnghieps/mine", "/api/nhansus/accept", "/api/nhansus/invites/pending", "/api/roleclaims/matrix", "/api/notifications", "/api/notifications/read/{notificationid}"];
  for (const path of expected) assert(paths.some(actual => actual.replace(/:[^}]+/g, "") === path), `Missing frontend endpoint ${path}`);
  console.log(`PASS ${expected.length} core frontend endpoints exist in backend Swagger`);
  const login = await call(null, "/api/account/authenticate", "POST", { email: "daidien.saokhue@seed.local", password });
  const session = field(login, "data"); const token = session.JWToken ?? session.jwToken;
  assert(/^[\w-]+$/.test(session.Id ?? session.id));
  const uid = session.Id ?? session.id;
  const domainId = Number(sql(`SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId"='${uid}'`));
  const inserted = sql(`INSERT INTO "Notifications" ("TieuDe", "NoiDung", "LoaiThongBao", "ReferenceType", "ReferenceId", "Created") VALUES ('${marker}', 'Integration read check', 'ViecLamMoi', 'TinTuyenDung', 999999, CURRENT_TIMESTAMP) RETURNING "Id"`);
  const notificationId = Number(inserted.split("\n")[0]); assert(notificationId > 0);
  sql(`INSERT INTO "NotificationRecipients" ("NotificationId", "NguoiDungId", "IsRead") VALUES (${notificationId}, ${domainId}, false)`);
  let list = await call(token, "/api/Notifications");
  let item = field(list, "notifications").find(n => Number(field(n, "id")) === notificationId);
  assert(item && field(item, "referenceType") === "TinTuyenDung" && field(item, "referenceId") === 999999);
  console.log("PASS notification REST contract includes routing references");
  await call(token, `/api/Notifications/read/${notificationId}`, "POST", {});
  list = await call(token, "/api/Notifications"); item = field(list, "notifications").find(n => Number(field(n, "id")) === notificationId);
  assert(field(item, "isRead") === true);
  console.log("PASS mark-read persists and subsequent frontend refresh sees it");
  const jobs = await call(token, "/api/tintuyendungs?_start=0&_end=1");
  const applications = await call(token, "/api/donungtuyens?_start=0&_end=1");
  assert(Number.isFinite(Number(field(jobs, "totalCount"))) && Number.isFinite(Number(field(applications, "totalCount"))));
  for (const status of [2, 3, 5, 6, 4]) {
    const filtered = await call(token, `/api/donungtuyens?TrangThai=${status}&_start=0&_end=1`);
    assert(Number.isFinite(Number(field(filtered, "totalCount"))));
    for (const row of field(filtered, "data") ?? []) assert(Number(field(row, "trangThai")) === status);
  }
  console.log("PASS reports receive real scoped total counts");
  await call(null, "/api/account/resend-verification-email", "POST", { Email: `${marker}@example.invalid` });
  console.log("PASS verification resend frontend action has a working backend endpoint");
} finally {
  sql(`DELETE FROM "Notifications" WHERE "TieuDe"='${marker}'`);
  console.log("Cleaned temporary integration notification.");
}
