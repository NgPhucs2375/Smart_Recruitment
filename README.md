# HIREAI — Smart Recruitment

HIREAI là nền tảng kết nối ứng viên với nhà tuyển dụng, hỗ trợ cả hai phía trong suốt quá trình tìm việc và tuyển người. Thay vì chỉ đăng tin và tìm kiếm theo từ khóa, hệ thống khai thác thông tin từ CV và tin tuyển dụng để giúp người dùng đánh giá mức độ phù hợp và đưa ra quyết định dễ dàng hơn.

# **Trải nghiệm website:** [hireais.dev](https://hireais.dev) 

## HIREAI làm được gì?

- **Với ứng viên:** tạo và quản lý hồ sơ, CV; tìm kiếm việc làm, lưu tin, ứng tuyển và theo dõi trạng thái đơn. Hệ thống gợi ý công việc phù hợp với CV và giải thích điểm phù hợp giữa ứng viên với tin tuyển dụng.
- **Với nhà tuyển dụng:** quản lý doanh nghiệp, tin tuyển dụng, ứng viên và các đơn ứng tuyển. Tính năng gợi ý ứng viên giúp nhân sự tìm người phù hợp với từng vị trí và xem thông tin hỗ trợ sàng lọc.
- **Với quản trị viên:** quản lý người dùng, doanh nghiệp, tin tuyển dụng và các danh mục dùng chung của nền tảng.
- **Với trợ lý Adam:** hỗ trợ hỏi đáp theo vai trò của người dùng, tra cứu thông tin tuyển dụng, hồ sơ và CV, đồng thời hỗ trợ phân tích, so sánh các lựa chọn.

HIREAI có website cho ứng viên và doanh nghiệp, backend ASP.NET Core và ứng dụng mobile dùng Expo. Các dịch vụ phát triển được chạy cùng nhau bằng Docker Compose; phần mobile khởi chạy riêng.

## Thành phần

| Thư mục | Nội dung |
|---|---|
| [`src/WebApi/WebApp.Server`](src/WebApi/WebApp.Server) | Backend .NET 10: API, xác thực, SignalR và Agent |
| [`src/WebApi/frontend`](src/WebApi/frontend) | Website Next.js |
| [`src/Mobile`](src/Mobile) | Ứng dụng Android/iOS dùng Expo |
| [`src/Application`](src/Application), [`src/Domain`](src/Domain), [`src/Infrastructure`](src/Infrastructure) | Nghiệp vụ, mô hình và các tích hợp backend |
| [`tests`](tests) | Các bài kiểm tra và smoke test |

## Chạy trên máy cá nhân

Yêu cầu **Docker Desktop** với Docker Compose. Chạy các lệnh dưới đây từ thư mục gốc của repository. Nếu chưa có `.env`, tạo từ file mẫu:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Điền `DEEPSEEK_API_KEY` trong `.env` nếu muốn dùng các tính năng AI. Các biến môi trường và cổng có thể chỉnh trong [`.env.example`](.env.example); không commit `.env` hoặc API key.

Kiểm tra cấu hình rồi khởi động PostgreSQL, Redis, RustFS (S3-compatible), backend và frontend:

```powershell
docker compose config --quiet
docker compose up --build
```

Lần đầu cần đợi các image và dependency được tải/build. Giữ terminal này mở để xem log; khi sửa mã nguồn backend hoặc frontend, các container phát triển sẽ tự tải lại. Truy cập:

| Dịch vụ | Địa chỉ mặc định |
|---|---|
| Website | [http://localhost:3001](http://localhost:3001) |
| API và Swagger | [http://localhost:8000/swagger](http://localhost:8000/swagger) |
| Object storage console | [http://localhost:9001](http://localhost:9001) |

Các cổng website/backend có thể thay bằng `FRONTEND_PORT` và `BACKEND_PORT` trong `.env`. Nếu cổng mặc định đã bị ứng dụng khác chiếm, chỉnh biến tương ứng trước khi chạy lại Compose.

## Kiểm tra và dừng

Mở một terminal khác tại thư mục gốc để xem trạng thái hoặc log:

```powershell
docker compose ps
docker compose logs -f backend frontend
```

Khi thay `*.csproj`, `package.json`, `package-lock.json` hoặc Dockerfile, build lại service liên quan:

```powershell
docker compose up --build backend frontend
```

Dừng stack và giữ dữ liệu trong các Docker volume:

```powershell
docker compose down
```

## Mobile và tài liệu chi tiết

Mobile chạy riêng bằng Expo. Xem [`src/Mobile/README.md`](src/Mobile/README.md) để cấu hình URL API cho Android Emulator hoặc điện thoại thật; tạo `src/Mobile/.env` từ file mẫu của thư mục đó. Nếu chạy frontend trực tiếp ngoài Docker, cần cấu hình `DOTNET_API_URL` và `DOTNET_AGENT_URL` trong `src/WebApi/frontend/.env.local` để Next.js kết nối backend.

- [Hướng dẫn phát triển mobile](src/Mobile/DEVELOPMENT_GUIDE.md)
- [Kiến trúc và tool của Agent](src/WebApi/WebApp.Server/Agent/README.md)
- [Triển khai production](deploy/README.md)
