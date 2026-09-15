# Kịch Bản Test E2E_UngTuyen — Một Ngày Đi Xin Việc Của Ứng Viên

> Người kiểm thử: dev-Khanh. Nhánh backend: dev-Scu (Docker `:8000`).
> Mục tiêu: ứng viên hoàn tất hồ sơ → nộp đơn vào tin công khai → theo dõi → dọn sạch.
> Kết quả: Passed 9/9, chạy lại được nhiều lần.

## 1. Bối cảnh (đọc trước khi chạy)

- **Nhân vật (ứng viên):** `ungvien.test@gmail.com` (hồ sơ NguoiDung Id=3).
  Token `jwt_ungvien` chỉ dùng ở bước xem đơn của chính mình; các bước dựng/dọn
  dùng token admin `jwt_admin` (ứng viên không có quyền tạo/xóa hộ).
- **Tin tuyển dụng:** tin mẫu Id=3, trạng thái `DangTuyen` — KHÔNG bao giờ xóa.
- **Trước mỗi lần chạy:** dọn DB (giữ seed, tin mẫu, tài khoản):
```powershell
Get-Content scripts/reset-test-data.sql | docker exec -i postgres psql -U postgres -d smart_recruitment_db
```

## 2. Màn 1 — Ứng viên chuẩn bị hồ sơ (token admin dựng hộ)

**S1 — Tạo hồ sơ** (`POST /api/hosoungviens`) → lưu Id vào `hsv_id`.
```json
{
  "NguoiDungId": 3,
  "HoTen": "Ung Vien Test",
  "SDT": "0901234567",
  "NgaySinh": "2000-01-01T00:00:00Z",
  "GioiTinh": "Nam",
  "DiaChi": "HCM",
  "GioiThieu": "test E2E"
}
```
Ngày sinh phải kèm giờ UTC (`T00:00:00Z`) — gửi ngày trần là 500 (BUG-02).
Trùng hồ sơ (chưa dọn lần trước) cũng 500 — chạy script reset rồi chạy lại.

**S2 — Upload CV** (`POST /api/cvungvien`, CV sẵn sàng nộp) → lưu Id vào `cv_id`.
```json
{
  "HoSoUngVienId": {{hsv_id}},
  "TenFile": "CV.pdf",
  "FileUrl": "https://test.vn/cv.pdf",
  "NgayUpload": "2026-09-11T00:00:00Z",
  "IsDefault": true,
  "PhuongThucTaoCV": 2,
  "TrangThaiTienTrinhCV": 9,
  "TrangThaiCV": 2,
  "LoiChiTiet": ""
}
```

## 3. Màn 2 — Ứng tuyển và theo dõi

**S3 — Lướt tin công khai** (`GET /api/tintuyendungs?_start=0&_end=5`) → `200`,
lưu Id tin đầu vào `tin_id` (`$.Data[0].Id`; trống tay nếu mảng rỗng).

**S4 — Nộp đơn** (`POST /api/donungtuyen`) → lưu Id vào `dut_id`.
```json
{
  "HoSoUngVienId": {{hsv_id}},
  "TinTuyenDungId": {{tin_id}},
  "CVUngVienId": {{cv_id}}
}
```
Luật đã verify: đơn CHỈ vào tin `DangTuyen` (tin `Nhap` → `"Tin tuyển dụng không còn nhận hồ sơ."`);
nộp 2 lần → `"Ứng viên đã nộp đơn cho tin này."` (chống trùng theo cặp hồ sơ + tin).

**S5 — Xem đơn của mình** (`GET /api/donungtuyen/show/{{dut_id}}`, token `jwt_ungvien`) → `200`.
Đúng luật ownership: chính chủ được xem; admin/token DN khác đều 403.

**S6 — Kiểm tra thông báo** (`GET /api/Notifications`) → `200`
(endpoint này trả object trần, không có `Succeeded` — assertion riêng).

## 4. Màn 3 — Dọn ngược (token admin, FK cấm xóa cha còn con)

S7 xóa đơn `{{dut_id}}` → S8 xóa CV `{{cv_id}}` → S9 xóa hồ sơ `{{hsv_id}}`.
Cả 3 phải `200`, lần sau chạy lại mới sạch.

## 5. Cách chấm đạt
- Assertion mỗi step: tắt contract validation; `Status = 200` + `$.Succeeded = true`
  (riêng S6 assert `$.UnreadCount` tồn tại).
- Extractor có điều kiện chỉ chạy khi step pass (fail mà ghi null đè biến là đổ domino).
- Token sống 60 phút: login lại đầu mỗi phiên chạy suite.
- Đạt: report **Passed 9/9**; DB sau chạy: đơn/CV/hồ sơ = 0, tin mẫu còn nguyên.

## 6. Biến dùng trong kịch bản (Local Value)
`jwt_admin` (dựng+dọn) · `jwt_ungvien` (xem đơn) · `hsv_id` · `cv_id` · `tin_id` · `dut_id`
