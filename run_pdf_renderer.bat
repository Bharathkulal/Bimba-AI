@echo off
TITLE Bimba AI - PDF Renderer (Playwright)
echo ========================================================
echo Starting Bimba AI PDF Renderer (Node.js + Playwright)...
echo Port: http://localhost:5174
echo ========================================================
cd /d "%~dp0backend\pdf_renderer"
node server.mjs
pause
