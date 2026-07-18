@echo off
chcp 65001 > nul
echo ===================================================
echo   DANG KHOI DONG HE THONG SAFEVOICE AI
echo ===================================================
echo.
echo 1. Dang mo trinh duyet (se hien thi sau 5 giay)...
start cmd /c "timeout /t 5 > nul && start http://localhost:3000/dang-nhap.html"

echo 2. Dang khoi dong cac dich vu qua Docker...
docker-compose up

pause
