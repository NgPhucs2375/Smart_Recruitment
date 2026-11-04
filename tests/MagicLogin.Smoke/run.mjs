// Smoke test cho UC03 — đăng nhập magic link (passwordless).
// Cần backend chạy (http://127.0.0.1:8000) và postgres container.
// Chạy: node tests/MagicLogin.Smoke/run.mjs
// Lưu ý: request-magic-link/register cùng chịu rate limit "auth-mail" 5 request/phút/IP,
// nên chạy file này riêng (cách suite khác >60s) nếu không sẽ gặp 429.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const base = process.env.AUTH_SMOKE_BASE_URL || "http://127.0.0.1:8000/api";
const marker = `magic-smoke-${Date.now()}`;
const accounts = [];          // email do test tạo ra, sẽ bị xoá
const probeEmails = [];       // mọi email có row MagicLinkToken, chỉ xoá token
const data = (object, key) => object?.[key] ?? object?.[key[0].toUpperCase() + key.slice(1)];
const sql = query => execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();

async function call(path, method = "GET", body, token) {
  const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await response.text();
  const result = text ? JSON.parse(text) : null;
  return { status: response.status, body: result, value: data(result, "data"), ok: response.ok && data(result, "succeeded") !== false };
}

async function ok(path, method = "GET", body, token) {
  const result = await call(path, method, body, token);
  assert(result.ok, `${method} ${path}: ${result.status} ${data(result.body, "message") ?? ""}`);
  return result.value ?? result.body;
}

const check = (value, message) => { assert(value, message); console.log(`PASS ${message}`); };

// Policy "auth-mail" giới hạn 5 request/phút/IP cho register + request-magic-link.
// Giữ 4 lượt mỗi cửa sổ rồi chờ sang cửa sổ mới để các suite chạy sát nhau không bị 429.
let mailRequests = 0;
async function mailCall(path, body) {
  if (++mailRequests > 4) {
    await new Promise(resolve => setTimeout(resolve, 61_000));
    mailRequests = 1;
  }
  return call(path, "POST", body);
}

async function mailOk(path, body) {
  const result = await mailCall(path, body);
  assert(result.ok, `POST ${path}: ${result.status} ${data(result.body, "message") ?? ""}`);
  return result.value ?? result.body;
}

const tokenOf = email => sql(`SELECT "Token" FROM "Identity"."MagicLinkToken" WHERE "Email"='${email}' ORDER BY "ExpiresAt" DESC LIMIT 1`);
const roleOfToken = email => sql(`SELECT "Role" FROM "Identity"."MagicLinkToken" WHERE "Email"='${email}' ORDER BY "ExpiresAt" DESC LIMIT 1`);

try {
  // 0. Đăng ký hoàn toàn bằng magic link: payload tab "Magic Link" ở /register gửi
  //    sau khi bỏ HoTen/SoDienThoai (MagicLinkToken không có cột nào cho chúng).
  const freshEmail = `${marker}-fresh@seed.local`;
  accounts.push(freshEmail); probeEmails.push(freshEmail);
  const freshSent = await mailCall("/account/request-magic-link", { Email: freshEmail, Purpose: "Register", Role: "UNG_VIEN" });
  check(freshSent.ok && freshSent.status !== 429, "Register-tab payload (email + role only) is accepted");
  check(roleOfToken(freshEmail) === "UNG_VIEN", "Registration token carries the requested candidate role");
  const fresh = await ok("/account/magic-login", "POST", { Email: freshEmail, Token: tokenOf(freshEmail) });
  const freshId = data(fresh, "id");
  check(Boolean(freshId) && data(fresh, "roles").includes("UNG_VIEN"), "Clicking the link provisions the candidate account");
  check(sql(`SELECT count(*) FROM "NguoiDung" WHERE "ApplicationUserId"='${freshId}'`) === "1", "Provisioned account gets its domain user row");
  check(sql(`SELECT count(*) FROM "HoSoUngVien" h JOIN "NguoiDung" n ON n."Id"=h."NguoiDungId" WHERE n."ApplicationUserId"='${freshId}'`) === "0", "Provisioned account has no profile yet, so /ho-so is the right next step");

  // 1. Ứng viên đăng ký (email chưa xác minh) rồi đăng nhập bằng magic link.
  const uvEmail = `${marker}-uv@seed.local`;
  accounts.push(uvEmail); probeEmails.push(uvEmail);
  const password = "Initial1!Password";
  await mailOk("/account/register", { role: "UNG_VIEN", email: uvEmail, hoTen: "Magic Smoke", soDienThoai: "0901234567", password, confirmPassword: password });
  check(sql(`SELECT "EmailConfirmed" FROM "Identity"."User" WHERE "Email"='${uvEmail}'`) === "f", "Registered account starts unverified");

  // Payload đúng như tab "Magic Link" trên trang đăng nhập gửi: không có Role.
  const sent = await mailCall("/account/request-magic-link", { Email: uvEmail, Purpose: "Login" });
  check(sent.ok && sent.status !== 429, "Login-tab magic link (no Role field) is accepted for an existing account");
  const uvToken = tokenOf(uvEmail);
  check(uvToken.length === 32, "Magic link token is issued for the existing account");
  check(roleOfToken(uvEmail) === "UNG_VIEN", "Token carries the account's own role, not a client-supplied one");

  const session = await ok("/account/magic-login", "POST", { Email: uvEmail, Token: uvToken });
  const access = session.JWToken ?? session.jwToken;
  check(Boolean(access) && data(session, "roles").includes("UNG_VIEN"), "Magic link signs the candidate in");
  await ok("/account/me", "GET", undefined, access);
  check(sql(`SELECT "EmailConfirmed" FROM "Identity"."User" WHERE "Email"='${uvEmail}'`) === "t", "Clicking the emailed link is treated as proof of mailbox ownership");
  check(!(await call("/account/magic-login", "POST", { Email: uvEmail, Token: uvToken })).ok, "The same magic token cannot be replayed");

  // 2. Nhân sự (chỉ tồn tại qua lời mời) cũng đăng nhập được bằng magic link.
  const hrEmail = sql(`SELECT lower(u."Email") FROM "Identity"."User" u JOIN "NguoiDung" n ON n."ApplicationUserId"=u."Id" WHERE n."VaiTro"='NHAN_SU' AND n."IsActive" LIMIT 1`).split(",")[0];
  assert(hrEmail, "No seeded NHAN_SU account found for the role check");
  probeEmails.push(hrEmail);
  const sentHr = await mailCall("/account/request-magic-link", { Email: hrEmail });
  check(sentHr.ok && sentHr.status !== 429, "Magic link is accepted for a NHAN_SU account (no Role needed)");
  check(roleOfToken(hrEmail) === "NHAN_SU", "NHAN_SU token is stored with its real role");
  const hrSession = await ok("/account/magic-login", "POST", { Email: hrEmail, Token: tokenOf(hrEmail) });
  check(data(hrSession, "roles").includes("NHAN_SU"), "NHAN_SU signs in through magic link");
  await ok("/account/revoke-token", "POST", { Token: data(hrSession, "refreshToken") });

  // 3. Email chưa đăng ký + không gửi Role: im lặng 200, không cấp token (chống dò email).
  const ghostEmail = `${marker}-ghost@seed.local`;
  probeEmails.push(ghostEmail);
  const ghost = await mailCall("/account/request-magic-link", { Email: ghostEmail });
  check(ghost.status === 200 && tokenOf(ghostEmail) === "", "Unknown email without Role gets the generic answer and no token");

  // 4. Vai trò quản trị vẫn không thể tự đăng ký qua magic link.
  const adminEmail = `${marker}-admin@seed.local`;
  probeEmails.push(adminEmail);
  check((await mailCall("/account/request-magic-link", { Email: adminEmail, Role: "QUAN_TRI_VIEN" })).status === 400, "Magic link cannot provision Admin");

  console.log("Magic-link login smoke checks completed.");
} finally {
  const tokenList = probeEmails.map(email => `'${email}'`).join(",");
  if (tokenList) sql(`DELETE FROM "Identity"."MagicLinkToken" WHERE "Email" IN (${tokenList});`);
  const accountList = accounts.map(email => `'${email}'`).join(",");
  if (accountList) sql(`BEGIN; DELETE FROM "HoSoNhaTuyenDung" WHERE "NguoiDungId" IN (SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${accountList}))); DELETE FROM "DoanhNghiep" WHERE "NguoiDaiDienId" IN (SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${accountList}))); DELETE FROM "NguoiDung" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${accountList})); DELETE FROM "Identity"."RefreshToken" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${accountList})); DELETE FROM "Identity"."User" WHERE "Email" IN (${accountList}); COMMIT;`);
  console.log("Cleaned temporary magic-link smoke data.");
}
