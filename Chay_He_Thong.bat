@echo off
chcp 65001 > nul
title SafeVoice AI - Khoi Dong He Thong
echo ===================================================
echo   DANG KHOI DONG HE THONG SAFEVOICE AI (DOCKER)
echo ===================================================
echo.

:: Kiem tra Docker Daemon
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [CANH BAO] Docker Desktop chua khoi dong hoac chua bat xong!
    echo Vui long mo Docker Desktop va cho bieu tuong ca voi chuyen sang mau xanh (Engine running).
    echo.
    echo Neu may bao can cap nhat WSL, hay chay 'wsl --update' bang quyen Admin.
    echo.
    pause
    exit /b 1
)

echo 1. Dang chuan bi mo trinh duyet (se mo sau 8 giay)...
start "" cmd /c "timeout /t 8 > nul && start http://localhost:3000/dang-nhap.html"

echo 2. Dang khoi dong toan bo he thong qua Docker (Postgres, Redis, Backend C#, AI Service)...
docker compose up --build

pause
