@echo off
TITLE Bimba AI - Backend Server
echo ========================================================
echo Starting Bimba AI Backend Server (FastAPI)...
echo ========================================================
cd /d "%~dp0backend"

if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] Virtual environment not found in backend\venv. Running with system python...
)

python run.py
pause
