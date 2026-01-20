@echo off
REM ==========================================
REM   Integrated System Launcher
REM   Yemen Crisis Prediction + Supply & Market Analysis
REM ==========================================

REM Change directory to the folder where this script is located
cd /d "%~dp0"

echo ==========================================
echo   Cleaning up old processes... 🧹
echo ==========================================
REM Force kill any existing node (frontend) or python (backend) processes to free up ports
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

echo.
echo ==========================================
echo   Starting Integrated Dashboard 🚀
echo   (Supply Chain + Food Security + Market Analysis)
echo ==========================================

echo.
echo [1/3] Launching Extended Backend Server...
echo    - Supply Chain APIs
echo    - Food Security APIs
echo    - Supply & Market APIs (NEW)
start "Backend Server - Extended" cmd /k "cd /d "%~dp0" && ..\venv\Scripts\activate && python Backend\main_extended.py"

echo.
echo [2/3] Preparing Browser...
REM Opens the browser after a 7-second delay to give the server time to start
REM Navigate to the integrated page
start cmd /c "timeout /t 7 >nul && start http://localhost:9002/integrated"

echo.
echo [3/3] Launching Frontend...
echo.
npm run dev

pause
