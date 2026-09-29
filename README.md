

# Run dotnet run in src/WebApi/WebApp.Server

# Access https://localhost:5173/ on browser

Login with username:superadmin@gmail.com and password:123Pa$$word!




# Sổ cây thư mục
tree ..\..

# Docker Compose development (Windows + Docker Desktop)

Tạo file môi trường local một lần:

```powershell
Copy-Item .env.example .env
```

Khởi động toàn bộ PostgreSQL, Redis, RabbitMQ, MinIO, backend và frontend:

```powershell
docker compose up --build
```

Không thêm `-d` trong lúc phát triển để thấy log hot reload. Sau lần build đầu,
sửa file C# hoặc frontend trên Windows sẽ tự cập nhật container qua bind mount:

- Backend: `dotnet watch`, API tại `http://localhost:8000`, Swagger tại `http://localhost:8000/swagger`.
- Frontend: Next.js dev server tại `http://localhost:3001`.
- RabbitMQ UI: `http://localhost:15672` (`guest` / `guest`).
- MinIO UI: `http://localhost:9001`.

Xem log riêng:

```powershell
docker compose logs -f backend frontend
```

Khi thay `*.csproj`, `package.json`, `package-lock.json` hoặc Dockerfile, rebuild service tương ứng:

```powershell
docker compose up --build backend frontend
```

Tắt stack nhưng giữ database/file data:

```powershell
docker compose down
```

Xóa cả dữ liệu local và cache volume:

```powershell
docker compose down -v
```

# Tìm đường dẫn tuyệt đối
dir ..\.. /s /b /ad 

# tìm đúng cproj
dir /s /b *.csproj


# kill PID
taskill /PID  17928 /F



# kill all PID và Server
taskkill /F /IM dotnet.exe /T
taskkill /F /IM WebApp.Server.exe /T

=======
# Sau khi chạy docker muốn test xem có lên chưa thì có thể vào
http://localhost:5000/swagger


# tao venv
python -m venv .venv

# active
.venv\Scripts\activate
