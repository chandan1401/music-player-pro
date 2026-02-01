@echo off
echo Starting Music Player with Mood Detection...
echo.

REM Start backend server
echo [1/3] Starting Backend Server (Port 4000)...
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

REM Start frontend server
echo [2/3] Starting Frontend (Port 5173/3000)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

REM Wait 3 seconds for frontend to initialize
timeout /t 3 /nobreak >nul

REM Start emotion detection API
echo [3/3] Starting Emotion Detection API (Port 5001)...
start "Emotion API" cmd /k "cd emotion-music-generator2\src && python emotion_api.py"

echo.
echo ================================================
echo  All Servers Starting...
echo ================================================
echo  Backend:  http://localhost:4000
echo  Frontend: http://localhost:5173 (or 3000)
echo  Emotion:  http://localhost:5001
echo ================================================
echo.
echo Waiting 15 seconds for services to initialize...
timeout /t 15 /nobreak

REM Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo All services started!
echo Close this window to keep servers running.
echo To stop servers, close the server windows.
pause
