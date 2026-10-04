@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo  WEBSITE QUAN LY VA DAT MON - KHOI DONG
echo ============================================

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js hoac Node.js chua co trong PATH.
  echo Hay cai Node.js LTS roi chay lai file nay.
  pause
  exit /b 1
)

if not exist ".env" (
  copy /Y ".env.example" ".env" >nul
  echo [OK] Da tao file .env tu .env.example
)

rem Chi dung cac tien trinh Node cu dang giu cong 3001.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue; foreach($x in $c){ try { $p=Get-Process -Id $x.OwningProcess -ErrorAction Stop; if($p.ProcessName -eq 'node'){ Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } } catch {} }" >nul 2>nul

if not exist "node_modules" (
  echo [1/3] Dang cai thu vien...
  call npm install
  if errorlevel 1 (
    echo [LOI] npm install that bai.
    pause
    exit /b 1
  )
) else (
  echo [1/3] Thu vien da san sang.
)

echo [2/3] Dang build giao dien...
call npm run build
if errorlevel 1 (
  echo [LOI] Build that bai. Xem thong bao phia tren.
  pause
  exit /b 1
)

echo [3/3] Dang khoi dong website...
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:3001'"
call npm start

echo.
echo Server da dung.
pause
endlocal
