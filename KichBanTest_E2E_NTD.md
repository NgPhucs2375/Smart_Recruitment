# Kịch Bản Test E2E_NTD — Một Ngày Làm Việc Của Nhà Tuyển Dụng

> Người kiểm thử: dev-Khanh. Nhánh backend: dev-Scu (Docker `:8000`).
> Cách đọc: mỗi bước kể **NTD đang làm gì trên giao diện**, kèm API tương ứng để người test bấm theo.
> Kết quả: cả chuỗi xanh 10/10, chạy lại được nhiều lần, tự dọn dữ liệu.

## 1. Bối cảnh (đọc trước khi chạy)

- **Nhân vật chính (NTD):** `ntd.dn1.test@gmail.com` — HR thuộc **DN 1** (Công ty Test 1).
  Đăng nhập lấy token, lưu vào biến `jwt_ntd_dn1`. Mọi thao tác nghiệp vụ dùng token này.
- **Nhân vật phụ (ứng viên):** `ungvien.test@gmail.com` (hồ sơ NguoiDung Id=3).
  Token admin `jwt_admin` chỉ dùng để dựng dữ liệu mẫu, không dùng để test nghiệp vụ NTD.
- **Tin tuyển dụng:** tin mẫu Id=3, đang `DangTuyen` (công khai) — KHÔNG bao giờ xóa.
- **Trước mỗi lần chạy:** dọn DB bằng 1 lệnh (giữ seed, tin mẫu, tài khoản):
```powershell
Get-Content scripts/reset-test-data.sql | docker exec -i postgres psql -U postgres -d smart_recruitment_db
```

## 2. Màn 1 — Chuẩn bị: có 1 ứng viên vừa nộp đơn (dựng bằng token admin)

> Ngoài đời thực, ứng viên tự nộp đơn trên trang việc làm. Ở đây ta dựng nhanh 1 đơn mẫu
> để NTD có cái mà xử lý. 3 bước này KHÔNG phải việc của NTD.

**S1 — Tạo hồ sơ cho ứng viên** (`POST /api/hosoungviens`): nhập họ tên, SĐT, ngày sinh
(lưu ý ngày phải kèm giờ UTC, ví dụ `2000-01-01T00:00:00Z`) → lưu Id vào biến `hsv_ntd`.
```json
{
  "NguoiDungId": 3,
  "HoTen": "Ung Vien Test",
  "SDT": "0901234567",
  "NgaySinh": "2000-01-01T00:00:00Z",
  "GioiTinh": "Nam",
  "DiaChi": "HCM",
  "GioiThieu": "phuc vu E2E NTD"
}
```

**S2 — Ứng viên upload CV** (`POST /api/cvungvien`, CV ở trạng thái sẵn sàng nộp) → lưu Id vào `cv_ntd`.
```json
{
  "HoSoUngVienId": {{hsv_ntd}},
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

**S3 — Ứng viên nộp đơn vào tin số 3** (`POST /api/donungtuyen`) → lưu Id vào `dut_ntd`.
```json
{
  "HoSoUngVienId": {{hsv_ntd}},
  "TinTuyenDungId": 3,
  "CVUngVienId": {{cv_ntd}}
}
```
Luật đã verify: đơn CHỈ nộp được vào tin đang `DangTuyen`; nộp 2 lần → báo
`"Ứng viên đã nộp đơn cho tin này."` (chống trùng theo cặp hồ sơ + tin).

## 3. Màn 2 — NTD vào việc (từ đây dùng token NTD, đúng như HR thao tác)

**S4 — NTD mở xem chi tiết đơn** (`GET /api/donungtuyen/show/{{dut_ntd}}`) → `200`,
thấy đủ hồ sơ + CV + tin của đơn.
Luật đã verify: NTD chỉ xem được đơn trên tin thuộc **đúng DN mình** — cầm token NTD
của DN khác vào là `403` (kể cả token hợp lệ). Đây là kiểm tra chủ sở hữu dữ liệu,
lớp dưới Casbin.

**S5 — NTD đánh giá ứng viên** (`POST /api/danhgia`): ghi nhận xét + kết luận → lưu Id vào `dg_ntd`.
```json
{
  "DonUngTuyenId": {{dut_ntd}},
  "NoiDungPhanHoi": "Ung vien sang gia",
  "KetLuan": "Dat, moi phong van",
  "NgayPhanHoi": "2026-09-11T00:00:00Z"
}
```

**S6 — NTD xem lại đánh giá** (`GET /api/danhgia/show/{{dg_ntd}}`) → `200`.

## 4. Màn 3 — Dọn dẹp (token admin, ngược thứ tự tạo vì DB cấm xóa cha còn con)

S7 xóa đánh giá `{{dg_ntd}}` → S8 xóa đơn `{{dut_ntd}}` → S9 xóa CV `{{cv_ntd}}` →
S10 xóa hồ sơ `{{hsv_ntd}}`. Cả 4 phải `200`, lần chạy sau mới không bị trùng.

## 5. Cách chấm đạt
- Mỗi step: tắt contract validation import kèm; gắn assertion `Status = 200` + `$.Succeeded = true`.
- Extractor chỉ chạy khi step pass (tránh step fail ghi null đè biến, làm đổ cả chuỗi sau).
- Token sống 60 phút: quá giờ thì login lại rồi Run.
- Đạt: report **Passed 10/10**, DB sau chạy không còn dữ liệu test (kiểm tra: đơn/CV/hồ sơ = 0, tin mẫu còn nguyên).

## 6. Biến dùng trong kịch bản (Local Value, làm mới mỗi lần chạy)
`jwt_admin` (dựng+dọn) · `jwt_ntd_dn1` (nghiệp vụ) · `hsv_ntd` · `cv_ntd` · `dut_ntd` · `dg_ntd`
