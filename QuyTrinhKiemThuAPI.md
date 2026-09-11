# Quy Trình Kiểm Thử API - Hệ Thống Smart Recruitment

> Tổng hợp từ source code thực tế (`src/WebApi/WebApp.Server`, `src/Application`, `src/Domain`, `src/Infrastructure`)
> và kết quả kiểm thử bằng Apidog trên môi trường Docker.
> Stack: ASP.NET Core + Clean Architecture + MediatR/CQRS + EF Core + PostgreSQL 16 + Redis 7 + RabbitMQ 3 + SignalR + Casbin (RBAC) + JWT + Swagger (OpenAPI 3.0.4).

---

## 1. Mục đích và phạm vi

### 1.1. Mục đích
- Xác minh mọi API đúng nghiệp vụ tuyển dụng (tin tuyển dụng, hồ sơ ứng viên, CV, đơn ứng tuyển, đánh giá, thông báo, nhân sự).
- Xác minh xác thực (JWT) và phân quyền 2 lớp (Casbin + RoleClaims + ownership trong handler).
- Phát hiện lỗi validation, phân trang, tích hợp liên module, datetime, trùng dữ liệu.

### 1.2. Phạm vi
- Toàn bộ Controllers trong `src/WebApi/WebApp.Server/Controllers`:
  - `AccountController` (`api/account`, 10 endpoint)
  - `UsersController` (`api/users`), `RolesController` (`api/roles`), `RoleClaimsController` (`api/roleclaims` + `matrix`)
  - 16 controller nghiệp vụ trong `Controllers/v1/*` (nhánh hiện tại **không còn** `ThongBaoController`)
  - `NotificationsController` (`api/Notifications`)
- Bổ trợ: `GET /health`, SignalR `/api/hubs/notifications`, AI Agent `/api/copilotkit`.
- Không bao gồm: test UI frontend, test chịu tải lớn, test AI Copilot chuyên sâu.

---

## 2. Tổng quan kiến trúc API (từ source)

### 2.1. Điểm vào và routing
- `Program.cs` - `app.MapControllers()`.
- `Controllers/BaseApiController.cs:14` - `[Route("api/v{version:apiVersion}/[controller]")]` nhưng mọi controller override bằng route cố định (`api/tintuyendungs`, `api/account`...) → **test theo route cố định**.
- Versioning đang bị comment (`AddApiVersioningExtension` rỗng).

### 2.2. Xác thực và phân quyền
- `UseAuthentication()` + `UseAuthorization()`, JWT Bearer (Swashbuckle security definition).
- Phân quyền 2 lớp trong `BaseApiController.cs:29` (`EnforcePermissionAndExecute`):
  1. Casbin `Enforcer(model.conf, policy.csv)` (Singleton, load lúc khởi động).
  2. Fallback `RoleClaims` trong DB dạng `resource#action` (đọc live mỗi request).
- Một số handler có **lớp 3: kiểm tra chủ sở hữu dữ liệu** (ví dụ `GetDonUngTuyenByIdQuery`: chỉ UngVien sở hữu / NTD cùng doanh nghiệp / Nhân sự đăng tin được xem — cả admin cũng 403).
- Hầu hết API `[Authorize]`; riêng `AccountController` chỉ `GET me` yêu cầu auth.

### 2.3. Định dạng Request / Response
- CRUD chuẩn CQRS: `GET ?_start&_end&_sort&_order&_filter` (+ FK tùy module), `GET show/{id}`, `POST`, `PUT {id}` (check `id != command.Id => 400`), `DELETE {id}`.
- Thành công (`Application/Wrappers/Response.cs`): `{Succeeded:true, Code, Message, Data}` với `PropertyNamingPolicy = null` → **giữ PascalCase**.
- Lỗi nghiệp vụ: thường **`HTTP 200 + Succeeded:false`** (handler `return new Response<T>("...")`), KHÔNG phải 404.
- Lỗi hệ thống/validation: `ApiException.StatusCode` giữ nguyên; `ValidationException => 400`; model binding sai kiểu → 400 dạng RFC9110 problem+json; unhandled → 500.
- Enum gửi dạng **số** (không có StringEnumConverter): `VaiTro (1-4)`, `PhuongThucTaoCV (1-3)`, `TrangThaiCV (0-3)`, `TrangThaiTinTuyenDung` lưu string.
- Mọi field **datetime phải kèm UTC (`...T00:00:00Z`)**, ngày naive → 500 (Postgres timestamptz).

---

## 3. Môi trường kiểm thử

| Thành phần | Giá trị |
|---|---|
| Backend Docker | `http://localhost:8000/swagger`, `http://localhost:8000/swagger/v1/swagger.json`, `http://localhost:8000/health` |
| Frontend | `http://localhost:3000` |
| Postgres / Redis / RabbitMQ | `5432` / `6379` / `5672` + management `15672` |
| DB backend dùng | `smart_recruitment_db` (lưu ý: còn DB cũ `KLTN` trong cùng Postgres — đừng sửa nhầm) |
| Tài khoản seed | `superadmin@gmail.com / 123Pa$$word!` (role `QUAN_TRI_VIEN`) |
| Tài khoản test | `ungvien.test@gmail.com / Test123!` (role `UNG_VIEN`, NguoiDung Id=3) |
| JWT trong `.env` | `JWT_KEY` (Base64 64 bytes), `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_DURATION=60` — thiếu là lỗi `IDX10703` |

---

## 4. Danh mục API (từ Swagger đang chạy, 70+ paths)

| Nhóm | Route | Ghi chú kiểm thử |
|---|---|---|
| Account (public trừ `me`) | `api/account/authenticate/register/confirm-email/forgot-password/reset-password/me/refresh-token/external-login/request-magic-link/magic-login` | `register/forgot/request-magic-link/invite` cần header `origin` |
| Identity | `api/users`, `api/roles` (+`assign/remove`), `api/roleclaims` (+`GET,PUT matrix`) | Chỉ admin |
| Nghiệp vụ CRUD | `api/cvungvien`, `danhgia`, `danhmucnghe`, `doanhnghiep`, `donungtuyen`, `hosonhatuyendungs`, `hosoungviens`, `ketquaphantichcv`, `ketquaphuhop`, `kinhnghiemlamviec`, `kynang`, `kynangtintuyendung`, `kynangungvien`, `nguoidungs`, `tintuyendungs` (+`POST {id}/fire`), `nhansus` (+`invite/token/invite/accept`) | Cùng mẫu 5 endpoint; `tintuyendungs` cần user thuộc doanh nghiệp |
| Notification | `GET api/Notifications`, `POST api/Notifications/read` | Trả object trần `{Notifications, UnreadCount}`, **không** bọc `Response<T>` |

---

## 5. Tích hợp Apidog (đã thực hiện)

Spec OpenAPI 3.0.4 import từ URL, bật auto-sync. Cấu trúc:
- **Environment `Docker-Local`**: `baseUrl=http://localhost:8000` (Shared), `origin=http://localhost:3000` (Shared); `jwt_admin/jwt_ntd/jwt_ungvien/refresh_*` + biến nối chuỗi `hsv_id/cv_id/tin_id/dut_id/nd_id/dn_id/kn_id/ungvien_id` (Local Value).
- **Base URL**: gán `{{baseUrl}}` cho cả 2 service (`Default module`, `Clean Architecture`).
- **Auth**: Bearer `{{jwt_admin}}` ở endpoint Root `Endpoints`; thư mục `Account` public để `No Auth`; request login tắt kế thừa; mỗi bản login chỉ giữ extractor đúng role nó (bản admin → `jwt_admin`, bản ungvien → `jwt_ungvien` + `ungvien_id`).
- **Extractor**: Store Variable, Response JSON, ví dụ `$.Data.JWToken`, `$.Data.Id`, `$.Data[0].Id`.
- **Assertion chuẩn**: tắt contract validation import kèm, gắn `Status = 200` + `$.Succeeded = true` (case lỗi chủ đích assert `$.Succeeded = false`).
- Quy tắc rút ra: path param `{id}` truyền qua tab Params (không gõ vào URL); biến số trong body JSON không để trong ngoặc kép; extractor phải có điều kiện chỉ chạy khi step pass (tránh ghi đè null khi fail); token sống 60 phút — login lại đầu mỗi phiên chạy suite lớn.

---

## 6. Kịch bản đã chạy

### 6.1. CRUD mẫu (DanhMucNghe, KyNang, DoanhNghiep, NguoiDung) — Pass
list → show đúng/sai (`200 + Succeeded:false`) → POST + Store id → PUT lệch Id → `400` → DELETE → show lại `false`. Kèm 2 case phân quyền mỗi module: No Auth → `401`, token UngVien → `403`.

### 6.2. Scenario E2E `E2E_UngTuyen` — Pass 9/9
`POST hosoungviens → POST cvungvien → GET tintuyendungs (lấy tin mẫu Id=3) → POST donungtuyen (token admin) → GET donungtuyen/show (token chính chủ ungvien) → GET Notifications → DELETE don → DELETE cv → DELETE hoso` (dọn ngược thứ tự tạo để qua FK Restrict; scenario chạy lại được nhiều lần).

---

## 7. Bug / phát hiện (đã verify lại bằng curl + log + query DB)

| # | Mức | Mô tả | Bằng chứng |
|---|---|---|---|
| 1 | Major | Seed thiếu grant `nguoidungs` cho `QUAN_TRI_VIEN` → admin 403 toàn module (đã cấp tạm `create#delete#edit#list#show` trực tiếp vào DB để test tiếp; dev cần bổ sung seed) | Query `RoleClaims`, repro curl |
| 2 | Major | Datetime không UTC (`"2000-01-01"`) → 500 do Npgsql từ chối `timestamptz` (`NgaySinh`, `NgayUpload`); fix phía test: gửi kèm `T00:00:00Z`; dev nên chuẩn hóa UTC + trả 400 thay vì 500 | Log backend `DbUpdateException` |
| 3 | Major | Trùng unique (tạo NguoiDung/HoSo đã tồn tại) → 500 thay vì 400 thân thiện | Repro POST lặp |
| 4 | Minor | Lỗi nghiệp vụ "không tìm thấy" trả `HTTP 200 + Succeeded:false` thay vì 404 (quy ước toàn hệ thống — test phải assert `$.Succeeded`, không assert status) | `GetDanhMucNgheByIdQuery` handler |
| 5 | Đúng (ghi nhận) | Phân quyền 2 lớp ở `GET donungtuyen/show`: Casbin + ownership trong handler — cả admin cũng 403, chỉ chính chủ/NTD/NS được xem | `GetDonUngTuyenByIdQuery.cs`, test token chéo |
| 6 | Minor | `GET /api/Notifications` không bọc `Response<T>` như mọi API khác → assertion chung `$.Succeeded` fail | `NotificationsController.cs` |
| 7 | Minor | Resource Casbin `TinTuyenDungController` ghi `"tinvuyendungs"` (sai chính tả) — hiện DB seed theo đúng chuỗi sai nên chạy được, nhưng nên sửa đồng bộ | `TinTuyenDungController.cs:24` |
| 8 | Env | `.env` thiếu JWT gây `IDX10703`; `BACKEND_PORT` default 8000 (không phải 5000); tồn tại DB cũ `KLTN` dễ sửa nhầm | `docker-compose.yml`, `ServiceExtensions.cs:88` |

---

## 8. Minh chứng (ảnh đính kèm báo cáo)
1. Bảng biến Environment `Docker-Local` đã điền (token + id nối chuỗi).
2. Folder CRUD mẫu (`DanhMucNghe`/`KyNang`) đủ 6–7 request.
3. Report scenario `E2E_UngTuyen` **Passed 9/9** + file Export Report.
