@echo off
TITLE Bimba AI Launcher
echo ========================================================
echo Launching Bimba AI Fullstack Application...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ========================================================

start "Bimba AI Backend" cmd /k "cd /d "%~dp0" && run_backend.bat"
start "Bimba AI Frontend" cmd /k "cd /d "%~dp0" && run_frontend.bat"

echo.
echo Both servers are launching in separate windows.
