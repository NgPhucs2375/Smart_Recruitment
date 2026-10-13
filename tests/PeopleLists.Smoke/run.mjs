import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const password = process.env.AUTH_SMOKE_PASSWORD;
if (!password) throw new Error("Set AUTH_SMOKE_PASSWORD for local seeded accounts.");
const base = process.env.AUTH_SMOKE_BASE_URL || "http://127.0.0.1:8000/api";
const field = (o, k) => o?.[k] ?? o?.[k[0].toUpperCase() + k.slice(1)];
const sql = query => execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db", "-t", "-A", "-c", query], { encoding: "utf8" }).trim();
async function call(path, token, body) {
  const response = await fetch(base + path, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json(); return { status: response.status, body: result, data: field(result, "data") };
}
async function login(email) { const result = await call("/account/authenticate", null, { email, password }); assert.equal(result.status, 200); return result.data.JWToken ?? result.data.jwToken; }
let ready = false;
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(base.replace(/\/api$/, "") + "/swagger/index.html", { signal: AbortSignal.timeout(3000) })).ok) { ready = true; break; } } catch { }
  await new Promise(r => setTimeout(r, 3000));
}
assert(ready, "Backend did not become ready");
const admin = await login("superadmin@gmail.com");
const owner = await login("daidien.saokhue@seed.local");
const candidate = await login("basicuser@gmail.com");
const all = await call("/nguoidungs/admin-list", admin);
assert.equal(all.status, 200); assert(all.data.length > 0);
assert(all.data.every(row => "HoTen" in row || "hoTen" in row));
assert(all.data.every(row => "PhoneNumber" in row || "phoneNumber" in row));
const known = all.data.find(row => field(row, "email") === "basicuser@gmail.com"); assert(known);
const searched = await call("/nguoidungs/admin-list?search=basicuser%40gmail.com", admin);
assert(searched.data.length > 0 && searched.data.every(row => String(field(row, "email")).includes("basicuser@gmail.com")));
console.log("PASS Admin list supplies name/phone and existing search contract remains valid");
assert.equal((await call("/nguoidungs/admin-list", owner)).status, 403);
assert.equal((await call("/nguoidungs/admin-list", candidate)).status, 403);
console.log("PASS user filters do not expose Admin data to other roles");
const members = await call("/nhansus", owner); assert.equal(members.status, 200); assert(Array.isArray(members.data) && members.data.length > 0);
const company = Number(sql(`SELECT "Id" FROM "DoanhNghiep" WHERE "NguoiDaiDienId"=(SELECT "Id" FROM "NguoiDung" WHERE "ApplicationUserId"=(SELECT "Id" FROM "Identity"."User" WHERE "Email"='daidien.saokhue@seed.local')) ORDER BY "Id" LIMIT 1`));
const ids = sql(`SELECT "NguoiDungId" FROM "HoSoNhaTuyenDung" WHERE "DoanhNghiepId"=${company}`).split("\n").map(Number);
assert(members.data.every(row => ids.includes(Number(field(row, "nguoiDungId")))));
assert(members.data.every(row => "Email" in row || "email" in row));
assert(members.data.every(row => typeof field(row, "isActive") === "boolean"));
assert(members.data.every(row => ["NHAN_SU", "NGUOI_DAI_DIEN"].includes(field(row, "vaiTro"))));
assert.equal((await call("/nhansus", candidate)).status, 403);
console.log("PASS staff list includes searchable email/phone/status only inside representative company scope");
