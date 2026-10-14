@echo off
chcp 65001 >nul
echo ========================================================
echo   Qora daftar - Lokal tarmoq (LAN) ulanishini yoqish
echo ========================================================
echo.

:: 1. Windows Firewall da portlarni ochish
echo [1/3] Windows Firewall da 8080 va 8081 portlariga ruxsat berilmoqda...
netsh advfirewall firewall delete rule name="PhoneSeller_Ports" >nul 2>&1
netsh advfirewall firewall add rule name="PhoneSeller_Ports" dir=in action=allow protocol=TCP localport=8080,8081 profile=any >nul 2>&1

:: 2. Tarmoq turini Private ga o'tkazish
echo [2/3] Tarmoq xavfsizligi xususiy (Private) rejimga o'tkazilmoqda...
powershell -Command "Set-NetConnectionProfile -NetworkCategory Private -ErrorAction SilentlyContinue" >nul 2>&1

:: 3. PortProxy (192.168.10.10 -> 127.0.0.1 Docker port forwarding)
echo [3/3] 192.168.10.10 portlarini Docker (127.0.0.1) ga yo'naltirish...
netsh interface portproxy reset >nul 2>&1
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=192.168.10.10 connectport=8080 connectaddress=127.0.0.1 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=192.168.10.10 connectport=8081 connectaddress=127.0.0.1 >nul 2>&1

echo.
echo ========================================================
echo   MUVAFFAQIYATLI SOZLANDI!
echo ========================================================
echo.
echo Quyidagi portlar yo'naltirildi:
netsh interface portproxy show all
echo.
echo Endi telefoningizdan quyidagi manzillarga kirishingiz mumkin:
echo.
echo   1. Admin Panel:   http://192.168.10.10:8081
echo   2. iOS MDM:       http://192.168.10.10:8080/api/v1/enroll/ios
echo.
pause
