# Hướng Dẫn Kiểm Thử API Bằng Apidog - Project Smart Recruitment

> Tài liệu nội bộ team. Mục đích: ai vào project cũng dựng được khung test trong 30 phút
> và hiểu những gì đã làm, kết quả tới đâu, bẫy nào đã gặp.
> Backend Docker: `http://localhost:8000` (Swagger UI + spec `GET /swagger/v1/swagger.json`, OpenAPI 3.0.4).

---

## 1. Apidog là gì, vì sao team dùng

Apidog = quản lý API + test chức năng hàng loạt + scenario E2E + báo cáo, tất cả trong 1 tool.
Project này có ~70 endpoint REST cùng khuôn CRUD nên Apidog phát huy: import Swagger 1 lần,
test mẫu 1 module rồi nhân rộng, chạy scenario tự động thay vì click tay từng API.

## 2. Chuẩn bị (5 phút)

1. `docker compose up -d` → mở `http://localhost:8000/swagger/v1/swagger.json` thấy JSON là được.
2. Cài Apidog (bản desktop), vào Project `SmartRecruitment` chung của team.
3. Tài khoản seed: `superadmin@gmail.com / 123Pa$$word!` (role `QUAN_TRI_VIEN`).
4. Tài khoản test đã tạo: `ungvien.test@gmail.com / Test123!` (role `UNG_VIEN`, NguoiDung Id=3).

## 3. Những gì đã dựng xong (dùng luôn, khỏi làm lại)

| Hạng mục | Chi tiết |
|---|---|
| Import | Spec từ URL Swagger, bật auto-sync |
| Environment `Docker-Local` | `baseUrl=http://localhost:8000`, `origin=http://localhost:3000` (Shared); token + biến nối chuỗi (Local Value, không sync cloud) |
| Base URL | `{{baseUrl}}` gán cho cả 2 service (`Default module`, `Clean Architecture`) |
| Auth | Bearer `{{jwt_admin}}` ở endpoint Root `Endpoints`; thư mục `Account` public để `No Auth`; request login tắt kế thừa |
| Login + extractor | Bản admin → `jwt_admin` ← `$.Data.JWToken`; bản ungvien → `jwt_ungvien` + `ungvien_id` (mỗi bản chỉ giữ extractor đúng role nó) |
| CRUD mẫu | `DanhMucNghe`, `KyNang`, `DoanhNghiep`, `NguoiDung` (list/show đúng-sai/POST+Store id/PUT lệch Id→400/DELETE + 2 case 401/403) |
| Scenario `E2E_UngTuyen` | 9 step Pass: tạo hồ sơ → CV → lấy tin mẫu → nộp đơn (admin) → xem đơn (token chính chủ) → Notifications → dọn ngược Đơn→CV→Hồ sơ |
| Dữ liệu mẫu trong DB | Tin tuyển dụng test Id=3 (`Tuyen Tester API`, `DangTuyen`) |

## 4. Quy ước bắt buộc (vi phạm là đỏ giả)

1. JSON backend giữ **PascalCase**: trích `$.Data.JWToken`, assert `$.Succeeded` (không phải camelCase).
2. Enum gửi dạng **số**: `VaiTro 1-4`, `PhuongThucTaoCV 1-3`, `TrangThaiCV 0-2...`, xem `src/Domain/Enums`.
3. Mọi **datetime kèm UTC**: `"2000-01-01T00:00:00Z"` — gửi ngày trần là 500 (Postgres timestamptz).
4. Path param `{id}` truyền qua **tab Params**, không gõ vào URL; biến số trong body JSON **không để trong ngoặc kép** (`"HoSoUngVienId": {{hsv_id}}`).
5. Lỗi nghiệp vụ "không tìm thấy" trả **`HTTP 200 + Succeeded:false`** (không phải 404) — assert theo `$.Succeeded`.
6. ID tự tăng, xóa không quay đầu — đừng assert số cứng, luôn nối bằng biến (`{{hsv_id}}`...).
7. Token sống 60 phút — login lại đầu mỗi phiên chạy suite lớn; extractor nên chỉ chạy khi step pass (tránh ghi đè null khi fail).
8. Request public (`authenticate/register/.../invite`) luôn `No Auth` + header `origin: {{origin}}` cho register/forgot/magic-link/invite.

## 5. Thêm module mới (15 phút/module)

Mở endpoint có sẵn của module → điền query/body theo Swagger → Store id riêng (`kn_id`, `dn_id`...) → Params `id` → test show/PUT-lệch/DELETE → thêm 2 case No Auth→401, token yếu→403. Không Duplicate cả folder (endpoint import đã đủ).

## 6. Bảng tra lỗi nhanh (toàn bộ đã gặp thật)

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| `IDX10703` / Swagger 500 | `.env` thiếu JWT | Điền `JWT_KEY/ISSUER/AUDIENCE/DURATION` rồi rebuild backend |
| Không mở được Swagger | Sai port — backend ở `:8000`, không phải `:5000` | Dùng `http://localhost:8000/swagger` |
| 401 ở `authenticate` | Dính header Bearer rỗng do kế thừa auth | Request login để `No Auth`, xóa header Authorization thừa |
| Biến không tự điền | Sai JSONPath / sai environment active / extractor nằm ở bản request trùng khác | `$.Data.JWToken`, đúng env, đúng bản request hay Send |
| 401 giữa chừng | Token hết hạn 60 phút | Login lại |
| 403 dù token admin | (1) Thiếu grant trong DB (đã gặp ở `nguoidungs` — tra `RoleClaims`, bổ sung) hoặc (2) handler kiểm tra chủ sở hữu (đơn ứng tuyển: chỉ chính chủ/NTD/NS, cả admin cũng 403) hoặc (3) gửi nhầm token yếu |
| 405 ở PUT/DELETE | Params `id` rỗng (biến null) | Kiểm tra Actual Request URL, nạp lại biến |
| 400 dạng RFC9110 | Sai kiểu/thiếu field (chưa tới code) | Đối chiếu field với command trong `src/Application/Features` |
| 500 save error khi POST | Trùng unique (đã tồn tại) | Dùng bản ghi có sẵn thay vì tạo |
| 500 khi DELETE | Con níu cha (FK Restrict) | Xóa ngược: Đơn → CV → Hồ sơ |
| Step HTTP 200 mà report đỏ | Contract validation của case mẫu | Tắt đi, gắn assertion `Status` + `$.Succeeded` |
| Scenario chạy lại đỏ step tạo | Dữ liệu lần trước chưa dọn | Chạy step DELETE dọn, hoặc để step cleanup cuối chuỗi lo |

## 7. Bug đã tìm ra cho dev (chi tiết trong `QuyTrinhKiemThuAPI.md` mục 7)

Thiếu grant `nguoidungs` cho admin; datetime naive → 500; trùng unique → 500 thay vì 400;
quy ước `200 + Succeeded:false`; ownership ở đơn ứng tuyển; `Notifications` lệch chuẩn response;
typo resource `tinvuyendungs`; Nhánh hiện tại không còn module `ThongBao`.

## 8. Việc còn lại cho team

- Nhân bản CRUD cho module chưa phủ (HoSo, CV, Don, Tin, NhanSu, DanhGia, KetQua...).
- Thêm step `refresh-token` đầu scenario dài; hẹn giờ chạy trong Scheduled Tasks.
- Đính kèm khi báo cáo: ảnh Environment, folder CRUD mẫu, report scenario xanh + file Export.
