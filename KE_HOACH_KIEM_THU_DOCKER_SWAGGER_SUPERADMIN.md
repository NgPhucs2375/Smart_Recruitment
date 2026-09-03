# Kế hoạch kiểm thử Docker Desktop, Swagger và Superadmin

## 1. Mục tiêu

- Xác nhận hệ thống khởi động đúng trên Docker Desktop.
- Kiểm tra kết nối giữa Backend, PostgreSQL, Redis, RabbitMQ và Smart Agent.
- Kiểm tra API thông qua Swagger.
- Xác nhận xác thực JWT và phân quyền Superadmin.
- Kiểm tra dữ liệu và tài khoản Superadmin sau khi restart container.

## 2. Thông tin môi trường

| Thành phần | Địa chỉ |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:5000` |
| Swagger | `http://localhost:5000/swagger/index.html` |
| Health check | `http://localhost:5000/health` |
| Smart Agent | `http://localhost:8000` |
| RabbitMQ Management | `http://localhost:15672` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

## 3. Chuẩn bị

1. Khởi động Docker Desktop.
2. Tạo file `.env` ở thư mục gốc nếu cần kiểm thử AI:

```env
GROQ_API_KEY=<api-key>
```

3. Build và khởi động hệ thống:

```powershell
docker compose up -d --build
```

4. Kiểm tra trạng thái container:

```powershell
docker compose ps
```

5. Xem log khi cần:

```powershell
docker compose logs backend
docker compose logs postgres
docker compose logs redis
docker compose logs rabbitmq
```

## 4. Kiểm thử Docker Desktop

| Mã | Nội dung | Kết quả mong đợi |
|---|---|---|
| D01 | Kiểm tra toàn bộ container | Các container cần thiết ở trạng thái `Running` |
| D02 | Gọi `/health` | HTTP `200` |
| D03 | Backend kết nối PostgreSQL | Không có lỗi connection trong log |
| D04 | Backend kết nối Redis | Không có lỗi Redis trong log |
| D05 | Backend kết nối RabbitMQ | Không có lỗi message broker trong log |
| D06 | Frontend gọi Backend | Không có lỗi CORS hoặc `Connection refused` |
| D07 | Smart Agent hoạt động | Có thể gọi agent khi đã cấu hình API key |
| D08 | Restart Backend | Backend khởi động lại và giữ nguyên dữ liệu |
| D09 | Dừng và chạy lại Compose | Hệ thống khởi động thành công |
| D10 | Kiểm tra volume PostgreSQL | Dữ liệu không mất sau khi restart |

> `depends_on` chỉ đảm bảo thứ tự khởi động container, không đảm bảo PostgreSQL, Redis và RabbitMQ đã sẵn sàng. Cần kiểm tra thêm log và endpoint `/health`.

## 5. Kiểm thử Swagger

### 5.1. Truy cập Swagger

Mở:

```text
http://localhost:5000/swagger/index.html
```

Swagger được bật khi:

```text
ASPNETCORE_ENVIRONMENT=Development
```

### 5.2. API không yêu cầu đăng nhập

Kiểm tra các endpoint:

- `POST /api/account/authenticate`
- `POST /api/account/register`
- `POST /api/account/forgot-password`
- `POST /api/account/refresh-token`

Kết quả cần xác nhận:

- Request hợp lệ trả về thành công.
- Thiếu trường bắt buộc trả về HTTP `400`.
- Tài khoản hoặc email trùng bị từ chối.
- Sai mật khẩu không trả về JWT.
- Đăng nhập thành công trả về access token và refresh token.

### 5.3. Kiểm thử JWT

1. Gọi `POST /api/account/authenticate`.
2. Sao chép access token.
3. Chọn **Authorize** trên Swagger.
4. Nhập:

```text
Bearer <access-token>
```

5. Gọi:

```text
GET /api/account/me
```

| Trường hợp | Kết quả mong đợi |
|---|---|
| JWT hợp lệ | HTTP `200` |
| Không có JWT | HTTP `401` |
| JWT sai hoặc hết hạn | HTTP `401` |
| JWT hợp lệ nhưng thiếu quyền | HTTP `403` |

### 5.4. Kiểm thử CRUD

Kiểm tra các nhóm API:

- Users
- Roles
- RoleClaims
- Danh mục nghề
- Doanh nghiệp
- Hồ sơ ứng viên
- CV ứng viên
- Tin tuyển dụng
- Đơn ứng tuyển
- Đánh giá
- Kết quả phân tích CV

Với mỗi nhóm, kiểm tra:

1. List.
2. Show theo ID.
3. Create.
4. Update.
5. Delete.
6. ID không tồn tại.
7. Payload thiếu hoặc sai kiểu dữ liệu.
8. Phân trang, lọc và sắp xếp nếu được hỗ trợ.

## 6. Kiểm thử Superadmin

### 6.1. Tài khoản mặc định

```text
Email: superadmin@gmail.com
Password: 123Pa$$word!
```

### 6.2. Luồng kiểm thử

| Mã | Thao tác | Kết quả mong đợi |
|---|---|---|
| SA01 | Đăng nhập Superadmin | Nhận JWT hợp lệ |
| SA02 | Gọi `/api/account/me` | Trả về đúng tài khoản và vai trò quản trị |
| SA03 | List roles | HTTP `200` |
| SA04 | Tạo role test | Role được tạo thành công |
| SA05 | Sửa role test | Dữ liệu được cập nhật |
| SA06 | Xóa role test | Role bị xóa |
| SA07 | List users | HTTP `200` |
| SA08 | Tạo user test | User được tạo thành công |
| SA09 | List role claims | HTTP `200` |
| SA10 | Tạo, sửa, xóa role claim | Quyền thay đổi đúng |
| SA11 | Gọi endpoint thiếu quyền | HTTP `403` |
| SA12 | Gọi endpoint không có JWT | HTTP `401` |

### 6.3. Quyền được seed

Superadmin mặc định được cấp:

```text
roleclaims: list, create, edit, delete
users: list, create
roles: list, create, edit, delete
```

Cần kiểm tra riêng các quyền đang được controller sử dụng nhưng chưa thấy trong claim mặc định:

```text
roles: show, assign, remove
```

## 7. Kiểm thử phân quyền

Tạo thêm:

- Một tài khoản ứng viên.
- Một tài khoản nhà tuyển dụng.

| Tài khoản | API quản trị | API đúng vai trò | API vai trò khác |
|---|---|---|---|
| Không đăng nhập | `401` | `401` hoặc public | `401` |
| Ứng viên | `403` nếu thiếu quyền | Thành công | `403` |
| Nhà tuyển dụng | `403` nếu thiếu quyền | Thành công | `403` |
| Superadmin | Thành công theo claim | Thành công nếu được cấp quyền | `403` nếu thiếu claim |

Cần xác nhận hai lớp bảo vệ:

1. `[Authorize]` kiểm tra người dùng đã đăng nhập.
2. `EnforcePermissionAndExecute` kiểm tra resource/action cụ thể.

## 8. Kiểm thử dữ liệu và khôi phục

- Xác nhận migration được áp dụng trong PostgreSQL.
- Restart backend và xác nhận Superadmin không bị tạo trùng.
- Đặt hậu tố `TEST_2026` cho dữ liệu kiểm thử.
- Xóa dữ liệu kiểm thử sau khi hoàn tất.
- Không dùng Superadmin để kiểm tra trường hợp thiếu quyền.
- Lưu status code, response, Docker logs và ảnh Swagger làm bằng chứng.

## 9. Tiêu chí nghiệm thu

Đợt kiểm thử đạt khi:

- Các container cần thiết hoạt động ổn định.
- `/health` trả về HTTP `200`.
- Swagger truy cập được và hiển thị API.
- Đăng nhập và JWT hoạt động đúng.
- Superadmin thực hiện đúng các quyền đã cấp.
- Request không xác thực trả về `401`.
- Request thiếu quyền trả về `403`.
- Dữ liệu sai trả về `400`.
- Dữ liệu và Superadmin vẫn tồn tại sau khi restart Docker.
- Không có lỗi nghiêm trọng trong Docker logs.

## 10. Kết thúc môi trường kiểm thử

```powershell
docker compose down
```

Không dùng lệnh xóa volume nếu cần giữ lại dữ liệu kiểm thử:

```powershell
docker compose down -v
```
