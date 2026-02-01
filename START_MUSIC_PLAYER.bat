@echo off
COLOR 0A
title Music Player Launcher
echo.
echo ========================================
echo    MUSIC PLAYER - AUTO STARTER
echo ========================================
echo.

REM Kill any existing node/python processes
echo [1/5] Cleaning up old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
ping 127.0.0.1 -n 3 >nul
echo     Done!
echo.

REM Check if backend dependencies are installed
echo [2/5] Checking backend dependencies...
cd /d "%~dp0backend"
if not exist "node_modules\" (
    echo     Installing backend dependencies...
    call npm install
) else (
    echo     Backend ready!
)
echo.

REM Check if frontend dependencies are installed
echo [3/5] Checking frontend dependencies...
cd /d "%~dp0frontend"
if not exist "node_modules\" (
    echo     Installing frontend dependencies...
    call npm install
) else (
    echo     Frontend ready!
)
echo.

REM Start Backend Server
echo [4/5] Starting Backend Server (Port 4000)...
cd /d "%~dp0backend"
start "BACKEND API - PORT 4000" cmd /k "npm start"
ping 127.0.0.1 -n 6 >nul
echo     Backend started!
echo.

REM Start Frontend Server
echo [5/5] Starting Frontend (Port 3000)...
cd /d "%~dp0frontend"
start "FRONTEND - PORT 3000" cmd /k "npm run dev"
ping 127.0.0.1 -n 9 >nul
echo     Frontend started!
echo.

REM Optional: Start Emotion API
echo.
echo Would you like to start Emotion Detection API? (Y/N)
echo (Required for camera-based mood detection)
set /p EMOTION_CHOICE=
if /i "%EMOTION_CHOICE%"=="Y" (
    echo.
    echo Starting Emotion API...
    cd /d "%~dp0emotion-music-generator2\src"
    start "EMOTION API - PORT 5001" cmd /k "python emotion_api.py"
    echo     Emotion API started!
)

echo.
echo ========================================
echo    ALL SERVERS STARTED!
echo ========================================
echo.
echo  Backend:  http://localhost:4000
echo  Frontend: http://localhost:3000
echo.
echo ========================================
echo    MOBILE ACCESS:
echo ========================================
echo.
echo  To access from your phone:
echo  1. Connect phone to SAME WiFi
echo  2. Run: MOBILE_ACCESS.ps1
echo  3. Get your computer's IP address
echo.
echo ========================================
echo Opening browser in 5 seconds...
ping 127.0.0.1 -n 6 >nul

REM Open browser
start http://localhost:3000

echo.
echo ========================================
echo  Music Player is running!
echo  
echo  Close server windows to stop.
echo  Press any key to exit this window.
echo ========================================
pause >nul
