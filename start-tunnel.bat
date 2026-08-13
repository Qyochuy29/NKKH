@echo off
title Cloudflare Tunnel cho He Thong Bao Dong
echo =======================================================
echo     DANG KHOI DONG DUONG HAM BAO MAT CLOUDFLARE
echo =======================================================
echo.
echo Vui long cho vai giay. Ban se thay mot duong link co duoi la ".trycloudflare.com"
echo Hay copy duong link do de nap vao phan cung (ESP32/Raspberry Pi) cua ban.
echo.
echo *Luu y: KHONG TAT cua so nay trong suot qua trinh chay phan cung!
echo.
C:\Users\admin\Downloads\cloudflared-windows-amd64.exe tunnel --url http://localhost:3000
pause
