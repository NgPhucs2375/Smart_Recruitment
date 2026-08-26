

# Run dotnet run in src/WebApi/WebApp.Server

# Access https://localhost:5173/ on browser

# Login with username:superadmin@gmail.com and password:123Pa$$word!




# Sổ cây thư mục
tree ..\..

# Lệnh chạy docker-compose 
docker compose up -d --build 
 
Tắt thì: docker compose down

# Tìm đường dẫn tuyệt đối
dir ..\.. /s /b /ad 

# tìm đúng cproj
dir /s /b *.csproj

# Sau khi chạy docker muốn test xem có lên chưa thì có thể vào
http://localhost:5000/swagger/index.html