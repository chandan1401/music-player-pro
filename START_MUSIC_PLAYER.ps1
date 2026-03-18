# Music Player - PowerShell Launcher
# Automatically starts all services and handles errors

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    🎵 MUSIC PLAYER - AUTO LAUNCHER 🎵     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-CommandExists {
    param([string]$CommandName)
    return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists "npm")) {
    Write-Host "❌ npm is not installed or not in PATH. Install Node.js and try again." -ForegroundColor Red
    exit 1
}

# Step 1: Clean up old processes
Write-Host "[1/5] Cleaning up old processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "      ✅ Cleanup complete`n" -ForegroundColor Green

# Step 2: Check backend dependencies
Write-Host "[2/5] Checking backend dependencies..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"
if (-not (Test-Path "node_modules")) {
    Write-Host "      Installing backend packages..." -ForegroundColor Cyan
    npm install | Out-Null
    Write-Host "      ✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "      ✅ Backend ready" -ForegroundColor Green
}
Write-Host ""

# Step 3: Check frontend dependencies
Write-Host "[3/5] Checking frontend dependencies..." -ForegroundColor Yellow
Set-Location "$projectRoot\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "      Installing frontend packages..." -ForegroundColor Cyan
    npm install | Out-Null
    Write-Host "      ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "      ✅ Frontend ready" -ForegroundColor Green
}
Write-Host ""

# Step 4: Start Backend
Write-Host "[4/5] Starting Backend Server (Port 4000)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d $projectRoot\backend && title BACKEND API - PORT 4000 && npm start"
Start-Sleep -Seconds 5
Write-Host "      ✅ Backend started`n" -ForegroundColor Green

# Step 5: Start Frontend
Write-Host "[5/5] Starting Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d $projectRoot\frontend && title FRONTEND - PORT 3000 && npm run dev"
Start-Sleep -Seconds 8
Write-Host "      ✅ Frontend started`n" -ForegroundColor Green

# Optional: Emotion API
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  Start Emotion API for mood detection?    ║" -ForegroundColor Magenta
Write-Host "║  (Camera-based mood player feature)       ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Magenta
$emotion = Read-Host "Enter Y for Yes, N for No"

if ($emotion -eq "Y" -or $emotion -eq "y") {
    if (-not (Test-CommandExists "python")) {
        Write-Host "⚠️  Python not found in PATH, skipping Emotion API." -ForegroundColor Yellow
    } else {
        Write-Host "`nStarting Emotion API..." -ForegroundColor Yellow
        Start-Process cmd -ArgumentList "/k", "cd /d $projectRoot\emotion-music-generator2\src && title EMOTION API - PORT 5001 && python emotion_api.py"
        Write-Host "✅ Emotion API started`n" -ForegroundColor Green
    }
}

# Verify servers
Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         Verifying Servers...               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Start-Sleep -Seconds 3

try {
    Invoke-WebRequest "http://localhost:4000/api/health" -UseBasicParsing -TimeoutSec 3 | Out-Null
    Write-Host "✅ Backend API is LIVE (http://localhost:4000)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend still loading... (check BACKEND window)" -ForegroundColor Yellow
}

$frontendPort = $null
foreach ($port in @(5173, 3000, 3001, 4173)) {
    try {
        Invoke-WebRequest "http://localhost:$port" -UseBasicParsing -TimeoutSec 2 | Out-Null
        Write-Host "✅ Frontend is LIVE (http://localhost:$port)" -ForegroundColor Green
        $frontendPort = $port
        break
    } catch { }
}

if (-not $frontendPort) {
    Write-Host "⚠️  Frontend still building... (check FRONTEND window)" -ForegroundColor Yellow
    $frontendPort = 5173
}

# Open browser
Write-Host "`n🌐 Opening browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:$frontendPort"

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║      🎉 MUSIC PLAYER IS RUNNING! 🎉       ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                            ║" -ForegroundColor White
Write-Host "║  App URL:  http://localhost:$frontendPort              ║" -ForegroundColor Cyan
Write-Host "║  Backend:  http://localhost:4000           ║" -ForegroundColor White
Write-Host "║                                            ║" -ForegroundColor White
Write-Host "║  Features:                                 ║" -ForegroundColor White
Write-Host "║  • Browse and play songs                   ║" -ForegroundColor White
Write-Host "║  • Create playlists                        ║" -ForegroundColor White
Write-Host "║  • Mood-based music (manual selection)     ║" -ForegroundColor White
Write-Host "║  • Jam Session (collaborate)               ║" -ForegroundColor White
Write-Host "║                                            ║" -ForegroundColor White
Write-Host "║  To stop: Close the server windows         ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "Press any key to exit (servers will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
