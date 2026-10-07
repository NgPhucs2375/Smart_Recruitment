import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const password = process.env.AUTH_SMOKE_PASSWORD;
if (!password) throw new Error("Set AUTH_SMOKE_PASSWORD for the existing local seed accounts.");
const origin = process.env.AUTH_SMOKE_BASE_URL || "http://127.0.0.1:8000/api";
const sql = query => execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
const field = (o, k) => o?.[k] ?? o?.[k[0].toUpperCase() + k.slice(1)];
let checks = 0;
const check = (condition, name) => { assert(condition, name); checks++; console.log(`PASS ${name}`); };
async function call(path, token, method = "GET", body) {
  const response = await fetch(origin + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }) }, ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
  const text = await response.text();
  const result = text ? JSON.parse(text) : null;
  return { status: response.status, body: result, value: field(result, "data"), ok: response.ok && field(result, "succeeded") !== false };
}
async function ok(path, token, method, body) {
  const result = await call(path, token, method, body);
  assert(result.ok, `${method ?? "GET"} ${path}: ${result.status} ${field(result.body, "message") ?? ""}`);
  return result.value ?? result.body;
}
async function login(email) { const session = await ok("/account/authenticate", null, "POST", { email, password }); return { id: field(session, "id"), token: session.JWToken ?? session.jwToken }; }
let admin, candidateRole, originalCvGrant, createdClaim;
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { const response = await fetch(origin.replace(/\/api$/, "") + "/swagger/index.html", { signal: AbortSignal.timeout(3000) }); if (response.ok) { ready = true; break; } } catch { /* startup compilation */ }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  assert(ready, "Backend startup timed out");
  check(sql(`SELECT count(*) FROM "__EFMigrationsHistory" WHERE "MigrationId"='20261007090000_HardenPermissionGrants'`) === "1", "Permission-hardening migration is applied");
  check(sql(`SELECT count(*) FROM (SELECT n."Id" FROM "NguoiDung" n LEFT JOIN "Identity"."UserRoles" ur ON ur."UserId"=n."ApplicationUserId" LEFT JOIN "Identity"."Role" r ON r."Id"=ur."RoleId" WHERE n."IsActive" GROUP BY n."Id", n."VaiTro" HAVING count(r."Id")<>1 OR min(r."Name")<>n."VaiTro"::text) mismatched`) === "0", "All active domain accounts have exactly one matching Identity role");
  check(sql(`SELECT count(*) FROM (SELECT h."NguoiDungId" FROM "HoSoNhaTuyenDung" h JOIN "NguoiDung" n ON n."Id"=h."NguoiDungId" WHERE n."IsActive" AND n."VaiTro"::text='NHAN_SU' GROUP BY h."NguoiDungId" HAVING count(DISTINCT h."DoanhNghiepId")>1) ambiguous`) === "0", "Active HR accounts have no ambiguous company membership");
  admin = await login("superadmin@gmail.com");
  const candidate = await login("basicuser@gmail.com");
  const owner = await login("daidien.saokhue@seed.local");
  const company = Number(sql(`SELECT "Id" FROM "DoanhNghiep" WHERE "NguoiDaiDienId"=(SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId"='${owner.id}') ORDER BY "Id" LIMIT 1`));
  const hr = await login(`nhansu.dn${company}.01@seed.local`);
  for (const [actor, expected] of [[admin, "QUAN_TRI_VIEN"], [candidate, "UNG_VIEN"], [owner, "NGUOI_DAI_DIEN"], [hr, "NHAN_SU"]]) {
    const me = await ok("/account/me", actor.token);
    check(field(me, "roles").length === 1 && field(me, "roles")[0] === expected, `${expected}: consistent live role`);
    if (actor !== admin) {
      check(!field(me, "permissions").some(p => ["users", "roles", "roleclaims", "nguoidungs", "dashboard", "quytackiemduyettins"].includes(field(p, "resource"))), `${expected}: no misleading Admin-only grants in /me`);
      for (const path of ["/users?_start=0&_end=1", "/roles", "/roleclaims/matrix", "/dashboard/admin-summary"])
        check((await call(path, actor.token)).status === 403, `${expected}: denied ${path}`);
    }
  }
  const matrix = await ok("/roleclaims/matrix", admin.token);
  check(matrix.resources.includes("cvungviens") && matrix.allowedActions.UNG_VIEN.cvungviens.includes("download"), "Matrix exposes download and stable resource catalog");
  check(matrix.allowedActions.NHAN_SU.users.length === 0 && matrix.allowedActions.UNG_VIEN.danhgias.every(a => !["create", "edit", "delete"].includes(a)), "Matrix UI capabilities match backend boundaries");
  const adminRole = matrix.roles.find(r => r.name === "QUAN_TRI_VIEN");
  check((await call(`/roles/${adminRole.id}`, admin.token, "PUT", { Id: adminRole.id, Name: "OTHER_ADMIN" })).status === 400, "Built-in role cannot be renamed");
  check((await call(`/roles/${adminRole.id}`, admin.token, "DELETE")).status === 400, "Built-in role cannot be deleted");
  check((await call("/roles", admin.token, "POST", { Name: "CUSTOM_ROLE" })).status === 400, "Unsupported roles cannot be created");
  candidateRole = matrix.roles.find(r => r.name === "UNG_VIEN").id;
  const before = JSON.stringify((await ok("/account/me", candidate.token)).Permissions ?? (await ok("/account/me", candidate.token)).permissions);
  check((await call("/roleclaims/matrix", admin.token, "PUT", { Matrix: { UNG_VIEN: { cvungviens: ["show"] }, UNKNOWN_ROLE: {} } })).status === 400, "Invalid matrix rejected before partial replacement");
  check(JSON.stringify(field(await ok("/account/me", candidate.token), "permissions")) === before, "Failed matrix leaves live permissions unchanged");
  check((await call("/roleclaims", admin.token, "POST", { RoleId: candidateRole, ClaimType: "users", ClaimValue: ["list"] })).status === 400, "Cannot grant candidate global account access");
  check((await call("/roleclaims", admin.token, "POST", { RoleId: candidateRole, ClaimType: "cvungviens", ClaimValue: ["show#edit"] })).status === 400, "Delimited/injected actions rejected");
  originalCvGrant = JSON.parse(sql(`SELECT json_build_object('id', "Id", 'value', "ClaimValue") FROM "Identity"."RoleClaims" WHERE "RoleId"='${candidateRole}' AND "ClaimType"='cvungviens'`));
  await ok(`/roleclaims/${originalCvGrant.id}`, admin.token, "PUT", { Id: originalCvGrant.id, ClaimType: "cvungviens", ClaimValue: originalCvGrant.value.split("#").filter(a => a !== "create") });
  const upload = new FormData(); upload.set("HoSoUngVienId", "999999"); upload.set("File", new Blob(["%PDF-1.4\n"], { type: "application/pdf" }), "permission-check.pdf");
  check((await call("/cvungviens", candidate.token, "POST", upload)).status === 403, "Legacy multipart upload cannot bypass a withdrawn create grant");
  await ok(`/roleclaims/${originalCvGrant.id}`, admin.token, "PUT", { Id: originalCvGrant.id, ClaimType: "cvungviens", ClaimValue: originalCvGrant.value.split("#").filter(a => a !== "edit") });
  const version = new FormData(); version.set("Payload", JSON.stringify({ CVUngVienId: 999999, HoSoUngVienId: 999999, TenFile: "check", NoiDung: { ThongTinLienHe: {} } }));
  check((await call("/cvungviens/save-version", candidate.token, "POST", version)).status === 403, "Saving an existing CV requires edit, not merely create");
  await ok(`/roleclaims/${originalCvGrant.id}`, admin.token, "PUT", { Id: originalCvGrant.id, ClaimType: "cvungviens", ClaimValue: originalCvGrant.value.split("#") }); originalCvGrant = null;
  const foreignCv = Number(sql(`SELECT c."Id" FROM "CVUngVien" c JOIN "HoSoUngVien" h ON h."Id"=c."HoSoUngVienId" JOIN "NguoiDung" n ON n."Id"=h."NguoiDungId" WHERE n."ApplicationUserId"<>'${candidate.id}' AND NOT c."IsDaXoa" ORDER BY c."Id" LIMIT 1`));
  if (foreignCv) check((await call("/ketquaphantichcvs", candidate.token, "POST", { CVUngVienId: foreignCv, NoiDungTrichXuat: "Should never be stored" })).status === 403, "Live candidate cannot create analysis for a foreign CV");
  // Use a normally absent candidate catalog grant to test the database uniqueness race.
  if (sql(`SELECT count(*) FROM "Identity"."RoleClaims" WHERE "RoleId"='${candidateRole}' AND "ClaimType"='kynangs'`) === "0") {
    const request = { RoleId: candidateRole, ClaimType: " KyNangs ", ClaimValue: [" LIST ", "list"] };
    const results = await Promise.all([call("/roleclaims", admin.token, "POST", request), call("/roleclaims", admin.token, "POST", request)]);
    createdClaim = Number(sql(`SELECT "Id" FROM "Identity"."RoleClaims" WHERE "RoleId"='${candidateRole}' AND "ClaimType"='kynangs'`));
    check(results.filter(r => r.ok).length === 1 && results.filter(r => r.status === 409).length === 1, "Concurrent duplicate role/resource grants yield one success and one conflict");
    check((await call("/kynangs?_start=0&_end=1", candidate.token)).ok, "New grant takes effect with the old JWT");
    await ok(`/roleclaims/${createdClaim}`, admin.token, "DELETE"); createdClaim = null;
    check((await call("/kynangs", candidate.token)).status === 403, "Revocation takes effect immediately with the same JWT");
  }
  console.log(`Completed ${checks} live authorization checks.`);
} finally {
  if (originalCvGrant && admin) await ok(`/roleclaims/${originalCvGrant.id}`, admin.token, "PUT", { Id: originalCvGrant.id, ClaimType: "cvungviens", ClaimValue: originalCvGrant.value.split("#") });
  if (createdClaim && admin) await ok(`/roleclaims/${createdClaim}`, admin.token, "DELETE");
  console.log("Restored temporary permission changes.");
}
