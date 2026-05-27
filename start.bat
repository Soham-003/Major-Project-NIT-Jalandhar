@echo off
REM Startup script for EEG Driver Fatigue Detection System on Windows

echo.
echo ================================================================================
echo EEG Driver Fatigue Detection & Monitoring System
echo ================================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    exit /b 1
)

echo [1/4] Installing backend dependencies...
cd /d "%~dp0webapp\backend"
call .\venv\Scripts\pip.exe install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Backend dependencies installation failed
    exit /b 1
)

echo.
echo [2/4] Installing frontend dependencies...
cd /d "%~dp0webapp\frontend"
call cmd.exe /c npm install
if %errorlevel% neq 0 (
    echo Error: Frontend dependencies installation failed
    exit /b 1
)

echo.
echo [3/4] Starting Flask backend server...
echo.
start cmd /k "cd /d "%~dp0webapp\backend" && .\venv\Scripts\python.exe app.py"
timeout /t 3

echo.
echo [4/4] Starting React frontend development server...
echo.
start cmd /k "cd /d "%~dp0webapp\frontend" && cmd.exe /c npm start"

echo.
echo ================================================================================
echo System startup complete!
echo.
echo Backend: http://127.0.0.1:5050
echo Frontend: http://localhost:3001
echo.
echo Press Ctrl+C in the popped up command windows to stop either server.
echo ================================================================================
