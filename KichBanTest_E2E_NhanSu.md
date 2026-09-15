# Kịch Bản Test E2E_NhanSu — Một Ngày Làm Việc Của Nhân Sự

> Người kiểm thử: dev-Khanh. Nhánh backend: dev-Scu (Docker `:8000`).
> Mục tiêu: HR đăng tin của DN mình, thử các trigger sai (bị chặn đúng luật),
> xem, rồi dọn. Toàn scenario dùng 1 token NS.

## 1. Bối cảnh (đọc trước khi chạy)

- **Nhân vật (nhân sự):** `nhansu.test@gmail.com / Test123!` — đi lên từ lời mời
  (register → accept bằng đúng email được mời → thành `NHAN_SU`).
- **Bẫy token:** login lấy token **SAU khi accept xong** — token login trước accept
  chỉ có role `UNG_VIEN` (giải mã JWT ở jwt.io thấy ngay: `sub/email/roles`).
  Token đúng phải chứa cả `UNG_VIEN` + `NHAN_SU` → biến `jwt_ns`.
- Scenario để Auth mặc định Bearer `{{jwt_ns}}`; login lại nếu quá 60 phút.

## 2. Màn 1 — HR đăng tin của DN mình

**S1 — POST `/api/tintuyendungs`** (DN tự lấy từ hồ sơ NS, không cần truyền) → lưu Id vào `tin_ns`.
```json
{
  "DanhMucNgheId": 1,
  "TieuDe": "Tin Cua NS Test",
  "MoTaCongViec": "mo ta",
  "KinhNghiemYeuCau": "1 nam",
  "YeuCauCongViec": "yeu cau",
  "QuyenLoi": "quyen loi",
  "DiaDiemLamViec": "HCM",
  "LuongToiThieu": 1000,
  "LuongToiDa": 2000,
  "NgayHetHan": "2026-10-11T00:00:00Z"
}
```
Kỳ vọng `200 + Succeeded:true`.

## 3. Màn 2 — Thử bấm bừa nút (máy trạng thái phải chặn)

Tin mới ở trạng thái `Nhap` — luật code: chỉ cho `GuiDuyet`. Cả 3 step đều
`POST /api/tintuyendungs/{{tin_ns}}/fire` (Params `id` = `{{tin_ns}}`), Auth NS:

**S3 — Tạm dừng tin** (`Trigger: 6 = TamDungTin`):
```json
{ "Id": {{tin_ns}}, "Trigger": 6, "GhiChu": "tam dung test" }
```
Kỳ vọng **bị từ chối**: `200 + Succeeded:false`,
`"Không thể thực hiện hành động 'TamDungTin' khi tin đang ở trạng thái 'Nhap'."`

**S4 — Mở lại tin** (`Trigger: 7 = MoLaiTin`) → bị từ chối tương tự.

**S5 — Đóng tin** (`Trigger: 9 = DongTin`) → bị từ chối tương tự.

## 4. Màn 3 — Xem và dọn

**S2/S6 — GET show tin mình đăng** (`GET /api/tintuyendungs/show/{{tin_ns}}`) → `200`
(NS được xem tin do chính mình đăng; admin/ungvien/DN khác đều 403 theo luật ownership).

**S7 — DELETE `/api/tintuyendungs/{{tin_ns}}`** → `200`, hết chuỗi.

## 5. Cách chấm đạt
- Assertion mỗi step: tắt contract validation; `Status = 200` + `$.Succeeded` đúng kỳ vọng
  (`true` cho S1/S2/S6/S7, `false` cho S3/S4/S5).
- Đạt: report xanh theo đúng kỳ vọng từng step (đỏ ở S3–S5 mà message đúng luật vẫn tính pass
  phủ định — đừng sửa step cho "xanh bằng mọi giá").
- Lưu ý BUG-11: transition fire thành công cũng không lưu DB, nên màn 2 chỉ verify được
  **guard chặn**, chưa verify được **chuyển trạng thái** — chạy lại sau fix.

## 6. Biến dùng trong kịch bản (Local Value)
`jwt_ns` (login sau accept) · `tin_ns`
