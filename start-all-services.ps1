Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║    MUSIC PLAYER - Starting All Services...      ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-CommandExists {
    param([string]$CommandName)
    return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists "npm")) {
    Write-Host "❌ npm is not installed or not in PATH. Install Node.js and try again." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$projectRoot\backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location "$projectRoot\backend"
    npm install | Out-Null
    Pop-Location
}

if (-not (Test-Path "$projectRoot\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location "$projectRoot\frontend"
    npm install | Out-Null
    Pop-Location
}

# Start backend server
Write-Host "[1/3] Starting Backend Server (Port 4000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; Write-Host '╔════════════════════════════════════╗' -ForegroundColor Green; Write-Host '║   BACKEND API SERVER (PORT 4000)  ║' -ForegroundColor Green; Write-Host '╚════════════════════════════════════╝' -ForegroundColor Green; npm start"
Start-Sleep -Seconds 4

# Start frontend server
Write-Host "[2/3] Starting Frontend (Port 5173/3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; Write-Host '╔════════════════════════════════════╗' -ForegroundColor Blue; Write-Host '║  FRONTEND SERVER (PORT 5173/3000) ║' -ForegroundColor Blue; Write-Host '╚════════════════════════════════════╝' -ForegroundColor Blue; npm run dev"
Start-Sleep -Seconds 4

# Start emotion detection API
if (Test-CommandExists "python") {
    Write-Host "[3/3] Starting Emotion Detection API (Port 5001)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\emotion-music-generator2\src'; Write-Host '╔════════════════════════════════════╗' -ForegroundColor Yellow; Write-Host '║  EMOTION API SERVER (PORT 5001)   ║' -ForegroundColor Yellow; Write-Host '╚════════════════════════════════════╝' -ForegroundColor Yellow; python emotion_api.py"
} else {
    Write-Host "[3/3] Skipping Emotion API (Python not found)." -ForegroundColor Yellow
}

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor White
Write-Host "║             All Servers Starting...              ║" -ForegroundColor White
Write-Host "╠════════════════════════════════════════════════════╣" -ForegroundColor White
Write-Host "║  Backend:  http://localhost:4000                 ║" -ForegroundColor Green
Write-Host "║  Frontend: http://localhost:5173 (or 3000)       ║" -ForegroundColor Blue
Write-Host "║  Emotion:  http://localhost:5001                 ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor White

Write-Host "`n⏳ Waiting 15 seconds for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check services and open browser
Write-Host "`n🔍 Verifying services..." -ForegroundColor Cyan

$allRunning = $true
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ Backend API is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend API not responding" -ForegroundColor Red
    $allRunning = $false
}

try {
    $emotion = Invoke-WebRequest -Uri "http://localhost:5001/health" -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ Emotion API is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Emotion API not responding (may still be loading TensorFlow)" -ForegroundColor Yellow
}

$frontendPort = $null
foreach ($port in @(5173, 3000, 3001, 4173)) {
    try {
        $test = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 1
        Write-Host "✅ Frontend is running on port $port" -ForegroundColor Green
        $frontendPort = $port
        break
    } catch { }
}

if (-not $frontendPort) {
    Write-Host "⚠️  Frontend not responding yet (may still be building)" -ForegroundColor Yellow
    $frontendPort = 5173  # Default
}

Write-Host "`n🌐 Opening browser at http://localhost:$frontendPort...`n" -ForegroundColor Cyan
Start-Process "http://localhost:$frontendPort"

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           🎵 MUSIC PLAYER IS READY! 🎵            ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Features:                                        ║" -ForegroundColor White
Write-Host "║  • Browse and play songs                          ║" -ForegroundColor White
Write-Host "║  • Create and manage playlists                    ║" -ForegroundColor White
Write-Host "║  • Mood Player - AI detects your emotion!         ║" -ForegroundColor White
Write-Host "║  • Jam Session - Collaborate with friends         ║" -ForegroundColor White
Write-Host "╠════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  To stop servers: Close the server windows        ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nPress any key to close this window (servers will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
