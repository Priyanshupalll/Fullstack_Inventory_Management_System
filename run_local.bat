@echo off
title ApexStock Enterprise Local Bootstrapper
echo =======================================================
echo   📦 APEXSTOCK ENTERPRISE LOCAL BOOTSTRAPPER 📦
echo =======================================================
echo.

:: Check CWD is correct
if not exist backend (
    echo [ERROR] Please run this batch script inside the project root folder.
    pause
    exit /b 1
)

echo [1/4] Preparing python backend environment...
cd backend
if not exist .venv (
    echo Creating Python Virtual Environment...
    python -m venv .venv
)
echo Activating virtual environment and installing packages...
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..
echo [SUCCESS] Backend dependencies installed successfully.
echo.

echo [2/4] Compiling frontend static React build...
cd frontend
echo Running npm install...
call npm install
echo Running npm run build...
call npm run build
cd ..
echo [SUCCESS] Frontend compiled into production-ready static assets.
echo.

echo [3/4] Spawning Unified Server Stack (FastAPI Serving SPA + API)...
set DATABASE_URL=sqlite:///../inventory.db
start "ApexStock Unified Server" cmd /k "cd backend && call .venv\Scripts\activate && set DATABASE_URL=sqlite:///../inventory.db && uvicorn app.main:app --host 127.0.0.1 --port 8000"
echo [INFO] Server active! Serving both static files and api routes on port 8000...
echo.

echo =======================================================
echo   🚀 APEXSTOCK LOCAL STARTUP PIPELINE COMPLETE! 🚀
echo =======================================================
echo.
echo * Unified Access Link: http://127.0.0.1:8000
echo.
echo Please leave the active terminal window open to keep the server running.
echo.
pause
