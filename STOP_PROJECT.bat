@echo off
setlocal
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue; if(-not $c){ Write-Host 'Khong co server nao dang chay tren cong 3001.'; exit }; foreach($x in $c){ try { $p=Get-Process -Id $x.OwningProcess -ErrorAction Stop; if($p.ProcessName -eq 'node'){ Stop-Process -Id $p.Id -Force; Write-Host ('Da dung Node PID ' + $p.Id) } else { Write-Host ('Cong 3001 dang do chuong trinh ' + $p.ProcessName + ' su dung; khong tu dong tat.') } } catch {} }"
pause
endlocal
