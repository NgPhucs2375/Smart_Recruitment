@echo off
setlocal

if "%~1"=="" goto help

if /I "%~1"=="up" goto up
if /I "%~1"=="down" goto down
if /I "%~1"=="build" goto build
if /I "%~1"=="restart" goto restart

if /I "%~1"=="backend" goto backend
if /I "%~1"=="frontend" goto frontend
if /I "%~1"=="infra" goto infra

if /I "%~1"=="rebuild-backend" goto rebuild_backend
if /I "%~1"=="rebuild-frontend" goto rebuild_frontend

if /I "%~1"=="logs" goto logs
if /I "%~1"=="logs-backend" goto logs_backend
if /I "%~1"=="logs-frontend" goto logs_frontend

if /I "%~1"=="ps" goto ps
if /I "%~1"=="backend-sh" goto backend_sh
if /I "%~1"=="frontend-sh" goto frontend_sh
if /I "%~1"=="db-sh" goto db_sh

if /I "%~1"=="clean" goto clean
if /I "%~1"=="help" goto help

echo Lenh khong hop le: %~1
goto help


:up
echo Khoi dong toan bo he thong...
docker compose up -d
goto end


:down
echo Tat he thong...
docker compose down
goto end


:build
echo Build lai va khoi dong toan bo he thong...
docker compose up -d --build
goto end


:restart
echo Restart cac container...
docker compose restart
goto end


:backend
echo Khoi dong Backend...
docker compose up -d backend
goto end


:frontend
echo Khoi dong Frontend...
docker compose up -d frontend
goto end


:infra
echo Khoi dong PostgreSQL, Redis, RabbitMQ...
docker compose up -d postgres redis rabbitmq
goto end


:rebuild_backend
echo Build lai rieng Backend...
docker compose up -d --build --force-recreate backend
goto end


:rebuild_frontend
echo Build lai rieng Frontend...
docker compose up -d --build --force-recreate frontend
goto end


:logs
docker compose logs -f
goto end


:logs_backend
docker compose logs backend -f
goto end


:logs_frontend
docker compose logs frontend -f
goto end


:ps
docker compose ps
goto end


:backend_sh
docker compose exec backend sh
goto end


:frontend_sh
docker compose exec frontend sh
goto end


:db_sh
docker compose exec postgres psql -U postgres -d smart_recruitment_db
goto end


:clean
echo.
echo CANH BAO: Lenh nay se xoa container VA volume database.
set /p confirm=Nhap YES de tiep tuc: 

if /I "%confirm%"=="YES" (
    docker compose down -v
) else (
    echo Da huy.
)

goto end


:help
echo.
echo ===== Smart Recruitment Docker Commands =====
echo.
echo   make up                - Khoi dong toan bo he thong
echo   make down              - Tat he thong
echo   make build             - Build lai va khoi dong
echo   make restart           - Restart container
echo.
echo   make backend           - Chay Backend + dependency
echo   make frontend          - Chay Frontend + dependency
echo   make infra             - Chi chay Postgres, Redis, RabbitMQ
echo.
echo   make rebuild-backend   - Build lai rieng Backend
echo   make rebuild-frontend  - Build lai rieng Frontend
echo.
echo   make logs              - Xem log tat ca
echo   make logs-backend      - Xem log Backend
echo   make logs-frontend     - Xem log Frontend
echo   make ps                - Xem trang thai container
echo.
echo   make backend-sh        - Vao shell Backend
echo   make frontend-sh       - Vao shell Frontend
echo   make db-sh             - Vao PostgreSQL
echo.
echo   make clean             - Xoa container + volume, RESET DATABASE
echo   make help              - Hien thi danh sach lenh
echo.

goto end


:end
endlocal