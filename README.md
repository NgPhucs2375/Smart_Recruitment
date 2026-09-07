

# Run dotnet run in src/WebApi/WebApp.Server

# Access https://localhost:5173/ on browser

Login with username:superadmin@gmail.com and password:123Pa$$word!




# sổ cây thư muvj
tree ..\..



# Tìm đường dẫn tuyệt đoois
dir ..\.. /s /b /ad 

# tìm đúng cproj
dir /s /b *.csproj

# kill PID
taskill /PID  17928 /F



# kill all PID và Server
taskkill /F /IM dotnet.exe /T
taskkill /F /IM WebApp.Server.exe /T