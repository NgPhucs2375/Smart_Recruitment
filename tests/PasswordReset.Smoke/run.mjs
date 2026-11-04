import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";

const base = process.env.RESET_SMOKE_BASE_URL || "http://127.0.0.1:8000/api";
const seedPassword = process.env.AUTH_SMOKE_PASSWORD;
if (!seedPassword) throw new Error("Set AUTH_SMOKE_PASSWORD for the existing seeded accounts.");
// Bật kiểm tra chống "mất token khi restart" (cần persist DataProtection key ring vào Redis).
const restartCheck = process.env.RESET_SMOKE_RESTART === "1";
const marker = `reset-smoke-${Date.now()}`;
const emails = [];
const GENERIC_TOKEN = "Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.";
const INACTIVE = "Tài khoản không hoạt động.";
const MAIL_PERMIT = 5, MAIL_WINDOW_MS = 60_000;
let lastMailAt = 0;

const data = (object, key) => object?.[key] ?? object?.[key[0].toUpperCase() + key.slice(1)];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const sql = query => execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
const check = (value, message) => { assert(value, message); console.log(`PASS ${message}`); };

// Endpoint gắn [EnableRateLimiting("auth-mail")] dùng chung hạn mức 5 request/phút/IP,
// nên suite phải tự pace và tự phục hồi khi bị 429 (AuthFlows.Smoke chủ đích bắn ngập hạn mức).
async function call(path, method = "GET", body, token) {
  const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await response.text();
  const result = text ? JSON.parse(text) : null;
  return { status: response.status, body: result, value: data(result, "data"), message: data(result, "message"), ok: response.ok && data(result, "succeeded") !== false };
}
async function ok(path, method = "GET", body, token) {
  const result = await call(path, method, body, token);
  assert(result.ok, `${method} ${path}: ${result.status} ${result.message ?? ""}`);
  return result.value ?? result.body;
}
async function login(email, password) {
  const result = await ok("/account/authenticate", "POST", { email, password });
  return { id: data(result, "id"), token: result.JWToken ?? result.jwToken, refresh: data(result, "refreshToken") };
}
async function mailEndpoint(path, body) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const paced = lastMailAt + Math.ceil(MAIL_WINDOW_MS / MAIL_PERMIT) + 250 - Date.now();
    if (paced > 0) await sleep(paced);
    lastMailAt = Date.now();
    // Trừ 10s đệm: đồng hồ host và daemon có thể lệch, và --since lọc theo timestamp log.
    const since = new Date(Date.now() - 10_000).toISOString();
    const result = await call(path, "POST", body);
    if (result.status === 429) { console.log(`  bị 429 tại ${path}, đợi cửa sổ rate limit kế tiếp`); await sleep(MAIL_WINDOW_MS + 2_000); continue; }
    return { ...result, since };
  }
  throw new Error(`${path} liên tục trả 429 — kiểm tra lại policy auth-mail`);
}

// Repo không có SMTP catcher: link reset chỉ quan sát được qua log echo dev-only
// (Auth:EchoResetLinkToLogs=true trong appsettings.Development.json).
function backendLogs(since) {
  const result = spawnSync("docker", ["logs", "--since", since, "backend"], { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`docker logs backend thất bại: ${result.stderr}`);
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}
function parseResetLink(text, email) {
  let best = null;
  for (const [, loggedEmail, link] of text.matchAll(/DEV_AUTH_RESET_LINK (\S+) (\S+)/g)) {
    if (loggedEmail !== email) continue;
    const params = new URL(link).searchParams;
    if (params.get("email") === email) best = params.get("token");
  }
  return best;
}
async function requestResetLink(email) {
  const result = await mailEndpoint("/account/forgot-password", { Email: email });
  check(result.status === 200, `forgot-password ${email}: HTTP 200 chống dò email`);
  for (let attempt = 1; attempt <= 20; attempt++) {
    const token = parseResetLink(backendLogs(result.since), email);
    if (token) return token;
    await sleep(1_000);
  }
  throw new Error(`Không thấy DEV_AUTH_RESET_LINK cho ${email} trong log backend. Bật Auth:EchoResetLinkToLogs=true và chạy backend qua docker compose.`);
}
async function waitHealthy(seconds = 420) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    try { if ((await fetch("http://127.0.0.1:8000/health/live")).ok) return; } catch { /* backend đang khởi động */ }
    await sleep(2_000);
  }
  throw new Error("Backend không healthy sau khi restart.");
}
const reset = (email, token, password) => call("/account/reset-password", "POST", { Email: email, Token: token, Password: password });
const lockoutState = email => sql(`SELECT COALESCE("LockoutEnd"::text,'NULL') || '|' || "AccessFailedCount" FROM "Identity"."User" WHERE "Email"='${email}'`);
const setLockout = (email, days) => sql(days === null
  ? `UPDATE "Identity"."User" SET "LockoutEnd"=NULL, "AccessFailedCount"=0 WHERE "Email"='${email}'`
  : `UPDATE "Identity"."User" SET "LockoutEnd"=now() + interval '${days} days', "AccessFailedCount"=5 WHERE "Email"='${email}'`);

try {
  const admin = await login("superadmin@gmail.com", seedPassword);
  const candidateRoleId = sql(`SELECT "Id" FROM "Identity"."Role" WHERE "Name"='UNG_VIEN'`);
  assert(candidateRoleId, "Role UNG_VIEN must exist");

  const weak = await mailEndpoint("/account/register", { role: "UNG_VIEN", email: `${marker}-weak@seed.local`, hoTen: "Reset Smoke", soDienThoai: "0901234567", password: "abcdef", confirmPassword: "abcdef" });
  check(weak.status === 400 && /^Mật khẩu phải có/.test(weak.message) && !/password|require|invalid/i.test(weak.message), `chính sách mật khẩu trả lời tiếng Việt: "${weak.message}"`);
  check(sql(`SELECT count(*) FROM "Identity"."User" WHERE "Email"='${marker}-weak@seed.local'`) === "0", "Mật khẩu yếu không tạo tài khoản");

  const email = `${marker}@seed.local`;
  emails.push(email);
  const initial = "Initial1!Passw";
  const uid = await mailEndpoint("/account/register", { role: "UNG_VIEN", email, hoTen: "Reset Smoke", soDienThoai: "0901234567", password: initial, confirmPassword: initial });
  check(typeof uid.value === "string", "Đăng ký tài khoản smoke thành công");
  await ok(`/users/${uid.value}`, "PUT", { Id: uid.value, RoleId: candidateRoleId, EmailConfirmed: true }, admin.token);
  const profileId = Number(sql(`SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId"='${uid.value}'`));
  const setActive = value => ok(`/nguoidungs/${profileId}`, "PUT", { Id: profileId, ApplicationUserId: uid.value, VaiTro: 4, IsActive: value }, admin.token);
  const ghost = await reset("khong-ton-tai@seed.local", "whatever-token", "Ghost1!Passw");
  check(ghost.status === 400 && ghost.message === GENERIC_TOKEN, "Email không tồn tại và token sai không phân biệt được");

  // 1. Luồng tích cực: quên mật khẩu -> đặt lại -> phiên cũ chết ngay.
  const session = await login(email, initial);
  const linkOne = await requestResetLink(email);
  check(Boolean(linkOne), "Lấy được reset token từ log dev-only");
  const first = await reset(email, linkOne, "Reset1!Passw");
  check(first.ok && /đặt lại/i.test(first.message), `Đặt lại mật khẩu thành công: "${first.message}"`);
  check((await call("/account/me", "GET", undefined, session.token)).status === 401, "Reset thu hồi access token cũ (xoay SecurityStamp)");
  check(!(await call("/account/refresh-token", "POST", { Token: session.refresh })).ok, "Reset thu hồi refresh token cũ");
  check(!(await call("/account/authenticate", "POST", { email, password: initial })).ok, "Mật khẩu cũ không còn dùng được");
  const afterReset = await login(email, "Reset1!Passw");
  check(Boolean(afterReset.token), "Mật khẩu mới đăng nhập được");

  // 2. Token chỉ dùng một lần.
  const replay = await reset(email, linkOne, "Replay1!Passw");
  check(replay.status === 400 && replay.message === GENERIC_TOKEN, "Reset token tái sử dụng bị từ chối bằng thông báo chung");
  check(!(await call("/account/authenticate", "POST", { email, password: "Replay1!Passw" })).ok, "Token bị từ chối không đổi được mật khẩu");

  // 3. Trạng thái tài khoản chỉ được tiết lộ SAU khi token đã đúng.
  await setActive(false);
  const blind = await reset(email, "bogus-token", "Leak1!Passw");
  check(blind.status === 400 && blind.message === GENERIC_TOKEN, "Tài khoản bị vô hiệu hóa + token sai -> vẫn chỉ báo lỗi token");
  const linkTwo = await requestResetLink(email);
  const disabled = await reset(email, linkTwo, "Leak1!Passw");
  check(disabled.status === 403 && disabled.message === INACTIVE, `Token hợp lệ trên tài khoản vô hiệu hóa bị từ chối: "${disabled.message}"`);

  // 4. Khóa bởi quản trị viên (> ngưỡng 1 ngày) phải được tôn trọng.
  await setActive(true);
  check(Boolean((await login(email, "Reset1!Passw")).token), "Mọi reset bị từ chối đều không ghi mật khẩu mới");
  setLockout(email, 30);
  const adminLocked = await reset(email, linkTwo, "Admin1!Passw");
  check(adminLocked.status === 403 && /quản trị viên/.test(adminLocked.message), `Khóa quản trị viên không bị reset gỡ: "${adminLocked.message}"`);
  check(!/NULL/.test(lockoutState(email)), "Reset từ chối vẫn giữ nguyên khóa quản trị viên");

  // 5. Khóa tạm vì nhập sai mật khẩu: cho reset và tự mở khóa.
  setLockout(email, null);
  for (let attempt = 1; attempt <= 5; attempt++) await call("/account/authenticate", "POST", { email, password: "Wrong1!Passw" });
  check(!/NULL/.test(lockoutState(email)), "5 lần sai mật khẩu khiến tài khoản bị khóa tạm");
  // Token đúng + mật khẩu quá ngắn -> phải là 400 nêu rõ ngưỡng 6 ký tự, không rơi về
  // lỗi token chung (nếu rơi về lỗi token thì client không bao giờ biết vì sao bị chặn).
  const tooShort = await reset(email, linkTwo, "short");
  check(tooShort.status === 400 && /^Mật khẩu phải có tối thiểu 6/.test(tooShort.message), `Policy chặn mật khẩu ngắn với message tiếng Việt: "${tooShort.message}"`);
  const selfUnlock = await reset(email, linkTwo, "Unlocked1!Passw");
  check(selfUnlock.ok, "Reset thành công khi đang khóa tạm và token chưa dùng vẫn còn hiệu lực");
  check(lockoutState(email).startsWith("NULL|0"), "Reset tự mở khóa tạm và đặt lại bộ đếm đăng nhập sai");
  check(Boolean((await login(email, "Unlocked1!Passw")).token), "Đăng nhập bình thường sau khi reset gỡ khóa tạm");

  // 6. Token phải sống sót qua restart -> chứng minh key ring lưu ngoài ephemeral keys.
  if (restartCheck) {
    const linkThree = await requestResetLink(email);
    console.log("  restart backend (dotnet watch có thể mất vài phút để boot lại)...");
    execFileSync("docker", ["compose", "restart", "backend"], { encoding: "utf8", cwd: process.cwd() });
    await waitHealthy();
    const afterRestart = await reset(email, linkThree, "Restart1!Passw");
    check(afterRestart.ok, "Reset token vẫn hợp lệ sau khi restart backend (key ring đã persist vào Redis)");
    check(Boolean((await login(email, "Restart1!Passw")).token), "Đăng nhập bằng mật khẩu đặt lại sau restart");
  } else {
    console.log("SKIP restart resilience — chạy lại với RESET_SMOKE_RESTART=1");
  }
  console.log("Password-reset smoke checks completed.");
} finally {
  const list = emails.map(value => `'${value}'`).join(",");
  if (list) sql(`BEGIN; DELETE FROM "HoSoNhaTuyenDung" WHERE "NguoiDungId" IN (SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${list}))); DELETE FROM "DoanhNghiep" WHERE "NguoiDaiDienId" IN (SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${list}))); DELETE FROM "NguoiDung" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${list})); DELETE FROM "Identity"."RefreshToken" WHERE "ApplicationUserId" IN (SELECT "Id" FROM "Identity"."User" WHERE "Email" IN (${list})); DELETE FROM "Identity"."User" WHERE "Email" IN (${list}); COMMIT;`);
  console.log("Cleaned temporary password-reset accounts.");
}
