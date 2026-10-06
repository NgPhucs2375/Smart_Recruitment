import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const base = process.env.AUTH_SMOKE_BASE_URL || "http://127.0.0.1:8000/api";
const seedPassword = process.env.AUTH_SMOKE_PASSWORD;
if (!seedPassword) throw new Error("Set AUTH_SMOKE_PASSWORD for the existing seeded accounts.");
const marker = `auth-smoke-${Date.now()}`;
const emails = [];
const data = (object, key) => object?.[key] ?? object?.[key[0].toUpperCase() + key.slice(1)];
const sql = query => execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
async function call(path, method = "GET", body, token) {
  const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  return { status: response.status, body: result, value: data(result, "data"), ok: response.ok && data(result, "succeeded") !== false };
}
async function ok(path, method = "GET", body, token) {
  const result = await call(path, method, body, token);
  assert(result.ok, `${method} ${path}: ${result.status} ${data(result.body, "message") ?? ""}`);
  return result.value ?? result.body;
}
async function login(email, password = seedPassword) {
  const result = await ok("/account/authenticate", "POST", { email, password });
  return { id: data(result, "id"), token: result.JWToken ?? result.jwToken, refresh: data(result, "refreshToken") };
}
const check = (value, message) => { assert(value, message); console.log(`PASS ${message}`); };
try {
  const admin = await login("superadmin@gmail.com");
  const owner = await login("daidien.saokhue@seed.local");
  const candidate = await login("basicuser@gmail.com");
  const company = Number(sql(`SELECT h."DoanhNghiepId" FROM "HoSoNhaTuyenDung" h JOIN "NguoiDung" n ON n."Id"=h."NguoiDungId" WHERE n."ApplicationUserId"='${owner.id}'`));
  const hr = await login(`nhansu.dn${company}.01@seed.local`);
  for (const [actor, role] of [[admin, "QUAN_TRI_VIEN"], [owner, "NGUOI_DAI_DIEN"], [candidate, "UNG_VIEN"], [hr, "NHAN_SU"]]) {
    const me = await ok("/account/me", "GET", undefined, actor.token);
    check(data(me, "roles").includes(role) && data(me, "permissions").length > 0, `${role}: login and live permissions`);
  }
  for (const actor of [owner, candidate, hr]) check((await call("/roles", "GET", undefined, actor.token)).status === 403, "Non-admin cannot manage roles");
  check((await call("/account/change-password", "POST", { MatKhauHienTai: seedPassword, MatKhauMoi: "Other1!Password" })).status === 401, "Anonymous cannot change password");
  const email = `${marker}@seed.local`; emails.push(email);
  const initial = "Initial1!Password";
  const registration = { role: "UNG_VIEN", email, hoTen: "Auth Smoke", soDienThoai: "0901234567", password: initial, confirmPassword: initial };
  check(!(await call("/account/register", "POST", { ...registration, role: "QUAN_TRI_VIEN" })).ok, "Public registration cannot create Admin");
  check(!(await call("/account/register", "POST", { ...registration, role: "NHAN_SU", inviteToken: "invalid-invite" })).ok, "Invalid HR invitation creates no account");
  check(sql(`SELECT count(*) FROM "Identity"."User" WHERE "Email"='${email}'`) === "0", "Failed signup leaves no Identity record");
  const uid = await ok("/account/register", "POST", registration);
  check(typeof uid === "string", "Candidate registration succeeds with a response wrapper");
  check(!(await call("/account/authenticate", "POST", { email, password: initial })).ok, "Unverified email cannot login");
  const forgot = await call("/account/forgot-password", "POST", { Email: `${marker}-missing@seed.local` });
  check(forgot.ok && data(forgot.body, "succeeded") === true, "Forgot-password response matches frontend contract");
  check((await call(`/account/confirm-email?userId=${uid}&code=***`)).status === 400, "Malformed verification link is a validation error, not 500");
  check((await call("/account/reset-password", "POST", { Email: email, Token: "invalid", Password: "Reset1!Password", ConfirmPassword: "Reset1!Password" })).status === 400, "Invalid reset token is rejected");
  check(!(await call("/account/request-magic-link", "POST", { Email: email, Role: "QUAN_TRI_VIEN" })).ok, "Magic link cannot provision Admin");
  const candidateRoleId = sql(`SELECT "Id" FROM "Identity"."Role" WHERE "Name"='UNG_VIEN'`);
  assert(candidateRoleId);
  await ok(`/users/${uid}`, "PUT", { Id: uid, RoleId: candidateRoleId, EmailConfirmed: true }, admin.token);
  let session = await login(email, initial);
  await ok("/roles/assign", "POST", { UserId: uid, RoleName: "QUAN_TRI_VIEN" }, admin.token);
  const elevated = await login(email, initial);
  check((await call("/roles", "GET", undefined, elevated.token)).ok, "Admin-assigned role takes effect");
  await ok("/roles/assign", "POST", { UserId: uid, RoleName: "UNG_VIEN" }, admin.token);
  check((await call("/roles", "GET", undefined, elevated.token)).status === 403, "Removed Admin role is denied even with the old Admin JWT");
  check(sql(`SELECT "VaiTro" FROM "NguoiDung" WHERE "ApplicationUserId"='${uid}'`) === "UNG_VIEN", "Domain role and Identity role stay synchronized");
  check(!(await call("/account/change-password", "POST", { MatKhauHienTai: "wrong", MatKhauMoi: "Changed1!Password" }, session.token)).ok, "Wrong current password is rejected");
  await ok("/account/change-password", "POST", { MatKhauHienTai: initial, MatKhauMoi: "Changed1!Password" }, session.token);
  check((await call("/account/me", "GET", undefined, session.token)).status === 401, "Password change invalidates old access token");
  check(!(await call("/account/refresh-token", "POST", { Token: session.refresh })).ok, "Password change revokes old refresh tokens");
  session = await login(email, "Changed1!Password");
  const rotated = await ok("/account/refresh-token", "POST", { Token: session.refresh });
  check(!(await call("/account/refresh-token", "POST", { Token: session.refresh })).ok, "Rotated refresh token cannot be reused");
  await ok("/account/revoke-token", "POST", { Token: data(rotated, "refreshToken") });
  check(!(await call("/account/refresh-token", "POST", { Token: data(rotated, "refreshToken") })).ok, "Logout revokes refresh token");
  session = await login(email, "Changed1!Password");
  const profileId = Number(sql(`SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId"='${uid}'`));
  await ok(`/nguoidungs/${profileId}`, "PUT", { Id: profileId, ApplicationUserId: uid, VaiTro: 4, IsActive: false }, admin.token);
  check((await call("/account/me", "GET", undefined, session.token)).status === 401 && !(await call("/account/authenticate", "POST", { email, password: "Changed1!Password" })).ok, "Inactive account cannot use old JWT or login");
  check(!(await call("/account/refresh-token", "POST", { Token: session.refresh })).ok, "Inactive account cannot refresh its session");
  const details = await ok(`/users/show/${uid}`, "GET", undefined, admin.token);
  check(!("PasswordHash" in details) && !("SecurityStamp" in details) && !("RefreshTokens" in details), "User responses expose no password hashes or refresh tokens");
  console.log("Authentication and authorization smoke checks completed.");
} finally {
  const list = emails.map(email => `'${email}'`).join(",");
  if (list) sql(`BEGIN; DELETE FROM "HoSoNhaTuyenDung" WHERE "NguoiDungId" IN (SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${list}))); DELETE FROM "DoanhNghiep" WHERE "NguoiDaiDienId" IN (SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${list}))); DELETE FROM "NguoiDung" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${list})); DELETE FROM "Identity"."RefreshToken" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${list})); DELETE FROM "Identity"."User" WHERE "Email" IN (${list}); COMMIT;`);
  console.log("Cleaned temporary authentication accounts.");
}
