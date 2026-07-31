@echo off
TITLE Bimba AI - Frontend Server
echo ========================================================
echo Starting Bimba AI Frontend Server (Vite)...
echo ========================================================
cd /d "%~dp0frontend"
npm run dev
pause
