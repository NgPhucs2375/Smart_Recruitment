import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const password = process.env.JOB_OWNER_TRANSFER_SMOKE_PASSWORD;
if (!password) throw new Error("Set JOB_OWNER_TRANSFER_SMOKE_PASSWORD for the seeded employer accounts.");
const base = process.env.JOB_OWNER_TRANSFER_SMOKE_BASE_URL || "http://127.0.0.1:8000/api";
const marker = `sang-nhuong-smoke-${Date.now()}`;

const sql = query => execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
const val = (o, k) => o?.[k] ?? o?.[k[0].toUpperCase() + k.slice(1)];
const check = (condition, label) => { assert(condition, label); console.log(`PASS ${label}`); };

async function call(token, path, method = "GET", body) {
  const response = await fetch(base + path, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json().catch(() => ({}));
  return { status: response.status, value: val(result, "data"), message: val(result, "message") ?? val(result, "errors"), raw: result, ok: response.ok && val(result, "succeeded") !== false };
}
async function ok(token, path, method = "GET", body) { const r = await call(token, path, method, body); assert(r.ok, `${method} ${path}: ${r.status} ${r.message ?? ""}`); return r.value ?? r.raw; }
async function denied(token, path, label, method = "GET", body) { const r = await call(token, path, method, body); check(!r.ok && (r.status === 403 || r.message?.includes("403")), `${label} (rejected: ${r.status} ${r.message ?? ""})`); return r; }
async function login(email) { const r = await ok(null, "/account/authenticate", "POST", { email, password }); return val(r, "jwToken") ?? r.JWToken ?? r.jwToken; }

// Nhân sự DN5 chưa đứng tên tin nào (so_tin = 0) -> mọi tin mang số dò đều là của suite này.
const REPHoSo = 5, RepId = 7, HRA = 35, HRAHoSo = 33, HRB = 36, HRBHoSo = 34, HRCo9 = 54;
const owner = tin => Number(sql(`SELECT "NguoiDangTinId" FROM "TinTuyenDung" WHERE "Id"=${tin}`));
const probeIds = () => { const s = sql(`SELECT COALESCE(string_agg("Id"::text, ','), '') FROM "TinTuyenDung" WHERE "TieuDe" LIKE '${marker}%'`); return s ? s.split(",").map(Number) : []; };
const soTinCua = nd => Number(sql(`SELECT count(*) FROM "TinTuyenDung" WHERE "NguoiDangTinId"=${nd}`));
const danhSach = async token => (await ok(token, "/tintuyendungs?_start=0&_end=300")).map(r => Number(val(r, "id")));
const rowCua = async (token, id) => (await ok(token, "/tintuyendungs?_start=0&_end=300")).find(r => Number(val(r, "id")) === id);

let snapshot = {};
const tao = async (token, suffix) => {
  const body = { danhMucNgheId: 1, tieuDe: `${marker} Backend ${suffix}`, moTaCongViec: "Probe sang nhượng nguoi dang tin", yeuCauCongViec: "1 nam kinh nghiem", diaDiemLamViec: "Ha Noi", phuongThucLamViec: 0, luongToiThieu: 1000, luongToiDa: 2000, kinhNghiemYeuCau: "1 nam", quyenLoi: "Probe", ngayHetHan: "2099-01-01", kyNangs: [] };
  const id = Number(await ok(token, "/tintuyendungs", "POST", body));
  assert(Number.isInteger(id) && id > 0, `created probe job ${id}`);
  return id;
};

try {
  snapshot = { tin: Number(sql("SELECT count(*) FROM \"TinTuyenDung\"")), notif: Number(sql("SELECT count(*) FROM \"Notifications\"")), nhanSu: Number(sql("SELECT count(*) FROM \"HoSoNhaTuyenDung\"")), ngoaiCuoc: Number(sql("SELECT count(*) FROM \"TinTuyenDung\" WHERE \"NguoiDangTinId\" NOT IN (7,35,36)")) };
  const rep = await login("daidien.saoviet@seed.local"), hra = await login("nhansu.dn5.02@seed.local"), hrb = await login("nhansu.dn5.03@seed.local"), hr9 = await login("nhansu.dn9.01@seed.local"), admin = await login("superadmin@gmail.com");

  const j1 = await tao(rep, "A"), j2 = await tao(rep, "B");
  check(owner(j1) === RepId && owner(j2) === RepId && (await danhSach(rep)).includes(j1), "Người đại diện tạo nháp và tự đứng tên người đăng tin");
  check(soTinCua(HRA) === 0 && soTinCua(HRB) === 0, "Hai nhân sự nhận tin dò khởi đầu không đứng tên tin nào");

  await denied(hra, `/tintuyendungs/show/${j1}`, "Nhân sự chưa được giao không mở được chi tiết tin");

  const moved = await call(rep, `/tintuyendungs/${j1}/sang-nhuong`, "POST", { id: j1, nguoiDangTinMoiId: HRA });
  check(moved.ok && owner(j1) === HRA, "Người đại diện giao từng tin cho nhân sự cùng doanh nghiệp");
  check(await ok(hra, `/tintuyendungs/show/${j1}`) && (await danhSach(hra)).includes(j1), "Người nhận thấy tin trong danh sách và mở được chi tiết");
  await denied(hrb, `/tintuyendungs/show/${j1}`, "Đồng nghiệp cùng công ty không phải chủ tin vẫn bị chặn");

  await denied(hra, `/tintuyendungs/${j1}/sang-nhuong`, "Nhân sự không được tự giao tin mình đang phụ trách cho người khác", "POST", { id: j1, nguoiDangTinMoiId: HRB });
  await denied(rep, `/tintuyendungs/${j1}/sang-nhuong`, "Không giao tin DN5 sang nhân sự doanh nghiệp khác", "POST", { id: j1, nguoiDangTinMoiId: HRCo9 });
  await denied(rep, "/tintuyendungs/sang-nhuong-hang-loat", "Giao hàng loạt cũng chặn người nhận khác doanh nghiệp", "POST", { tuNguoiDangTinId: HRA, nguoiDangTinMoiId: HRCo9 });

  await ok(rep, `/tintuyendungs/${j2}/sang-nhuong`, "POST", { id: j2, nguoiDangTinMoiId: HRA });
  check(soTinCua(HRA) === 2, "Người nhận gom đủ hai tin dò");

  const xoa = await call(rep, `/nhansus/${HRAHoSo}`, "DELETE");
  check(!xoa.ok && xoa.status === 400 && /tin tuyển dụng/.test(String(xoa.message)), `Xóa nhân sự còn tin bị chặn và báo "sang nhượng trước" (${xoa.message})`);
  check(Number(sql(`SELECT count(*) FROM "HoSoNhaTuyenDung" WHERE "Id"=${HRAHoSo}`)) === 1 && soTinCua(HRA) === 2, "Lời chặn không xóa hồ sơ hay làm mất tin");

  const bulk = await call(rep, "/tintuyendungs/sang-nhuong-hang-loat", "POST", { tuNguoiDangTinId: HRA, nguoiDangTinMoiId: HRB });
  check(bulk.ok && Number(bulk.value) === 2 && owner(j1) === HRB && owner(j2) === HRB && soTinCua(HRA) === 0, `Giao hàng loạt chuyển đúng 2 tin của người này (data=${bulk.value})`);
  check((await danhSach(hrb)).includes(j1) && (await danhSach(hrb)).includes(j2) && !(await danhSach(hra)).includes(j1), "Danh sách hai nhân sự đổi theo chủ tin ngay sau khi giao loạt");

  const tuChoi = await call(hrb, "/tintuyendungs/sang-nhuong-hang-loat", "POST", { tuNguoiDangTinId: HRB, nguoiDangTinMoiId: HRB });
  check(!tuChoi.ok && tuChoi.status === 400, `Giao cho chính mình bị từ chối 400 (${tuChoi.message})`);

  const adminMoved = await call(admin, `/tintuyendungs/${j1}/sang-nhuong`, "POST", { id: j1, nguoiDangTinMoiId: RepId });
  check(adminMoved.ok && owner(j1) === RepId, "Quản trị viên giao tin trở lại người đại diện");
  const lai = await call(rep, `/tintuyendungs/${j1}/sang-nhuong`, "POST", { id: j1, nguoiDangTinMoiId: RepId });
  check(lai.ok && /đã thuộc về/.test(String(lai.message)), `Giao lại cho đúng chủ cũ là thao tác rỗng (${lai.message})`);

  const loai = sql(`SELECT DISTINCT "ReferenceType" FROM "Notifications" WHERE "ReferenceId" IN (${j1},${j2})`);
  check(loai === "SangNhuongNguoiDangTin", `Thông báo sang nhượng dùng ReferenceType riêng, không lẫn với "TinTuyenDung" (${loai})`);
  check(Number(sql(`SELECT count(*) FROM "Notifications" WHERE "ReferenceType"='TinTuyenDung' AND "ReferenceId" IN (${j1},${j2})`)) === 0, "Không tạo ghi chú kiểm duyệt giả trên tin dò");
  check(!(await rowCua(rep, j2))?.ghiChuKiemDuyet, "UI danh sách tin không hiển thị nội dung sang nhượng làm GhiChuKiemDuyet");
  const nguoiNhan = sql(`SELECT string_agg(r."NguoiDungId"::text, ',' ORDER BY r."NguoiDungId") FROM "NotificationRecipients" r JOIN "Notifications" n ON n."Id"=r."NotificationId" WHERE n."ReferenceType"='SangNhuongNguoiDangTin'`);
  check(nguoiNhan.split(",").map(Number).includes(HRA) && nguoiNhan.split(",").map(Number).includes(HRB), `Cả hai phía đều nhận thông báo (recipients=${nguoiNhan})`);
  const soLuong = sql(`SELECT count(*) FROM "Notifications" WHERE "ReferenceType"='SangNhuongNguoiDangTin' AND "ReferenceId" IS NULL`);
  check(Number(soLuong) >= 2, `Lượt giao hàng loạt ghi thông báo gộp, không trỏ một tin bừa (${soLuong} dòng)`);

  await ok(rep, `/tintuyendungs/${j1}`, "DELETE");
  await ok(rep, `/tintuyendungs/${j2}`, "DELETE");
  check(probeIds().length === 0, "Xóa xong tin dò, không còn số dò trong bảng tin");
} finally {
  sql(`DELETE FROM "NotificationRecipients" WHERE "NotificationId" IN (SELECT "Id" FROM "Notifications" WHERE "ReferenceType"='SangNhuongNguoiDangTin');`);
  sql(`DELETE FROM "Notifications" WHERE "ReferenceType"='SangNhuongNguoiDangTin';`);
  const probes = probeIds().filter(id => id);
  if (probes.length) sql(`DELETE FROM "KyNangTinTuyenDung" WHERE "TinTuyenDungId" IN (${probes.join(",")}); DELETE FROM "TinTuyenDung" WHERE "Id" IN (${probes.join(",")}) AND "TieuDe" LIKE '${marker}%';`);
  const sau = { tin: Number(sql("SELECT count(*) FROM \"TinTuyenDung\"")), notif: Number(sql("SELECT count(*) FROM \"Notifications\"")), nhanSu: Number(sql("SELECT count(*) FROM \"HoSoNhaTuyenDung\"")), ngoaiCuoc: Number(sql("SELECT count(*) FROM \"TinTuyenDung\" WHERE \"NguoiDangTinId\" NOT IN (7,35,36)")) };
  console.log(`Dọn suite: tin ${snapshot.tin} -> ${sau.tin}, notifications ${snapshot.notif} -> ${sau.notif}, nhan su ${snapshot.nhanSu} -> ${sau.nhanSu}, tin ngoai dien ${snapshot.ngoaiCuoc} -> ${sau.ngoaiCuoc}.`);
  assert(sau.tin === snapshot.tin && sau.notif === snapshot.notif && sau.nhanSu === snapshot.nhanSu && sau.ngoaiCuoc === snapshot.ngoaiCuoc, "Database trở về đúng hiện trạng trước khi chạy smoke");
}
