# Mobile Access Setup for Music Player
# This script shows your computer's IP address for mobile access

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     📱 MOBILE ACCESS - NETWORK SETUP 📱              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Getting your computer's IP address...`n" -ForegroundColor Yellow

# Get all IPv4 addresses (exclude loopback)
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } |
    Select-Object IPAddress, InterfaceAlias

if ($ipAddresses.Count -eq 0) {
    Write-Host "❌ No network IP found. Make sure you're connected to WiFi/Ethernet.`n" -ForegroundColor Red
    exit
}

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           YOUR COMPUTER'S IP ADDRESSES                ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Green

foreach ($ip in $ipAddresses) {
    Write-Host "🌐 $($ip.InterfaceAlias): " -ForegroundColor Cyan -NoNewline
    Write-Host "$($ip.IPAddress)" -ForegroundColor Yellow
}

# Get the primary IP (usually WiFi or Ethernet)
$primaryIP = ($ipAddresses | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*" } | Select-Object -First 1).IPAddress

if (-not $primaryIP) {
    $primaryIP = $ipAddresses[0].IPAddress
}

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║      📱 ACCESS FROM YOUR MOBILE PHONE 📱             ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "STEP 1: Make sure your phone is on the SAME WiFi network" -ForegroundColor Cyan
Write-Host "        as your computer.`n" -ForegroundColor White

Write-Host "STEP 2: Open browser on your phone and go to:" -ForegroundColor Cyan
Write-Host "`n        📱 http://${primaryIP}:3000`n" -ForegroundColor Yellow -BackgroundColor DarkBlue

Write-Host "STEP 3: Bookmark it for easy access!`n" -ForegroundColor Cyan

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`n💡 IMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "   ✅ Computer and phone MUST be on same WiFi" -ForegroundColor White
Write-Host "   ✅ Windows Firewall may block - see below if blocked" -ForegroundColor White
Write-Host "   ✅ Music player servers must be running" -ForegroundColor White
Write-Host "   ✅ Use the IP address, NOT 'localhost'`n" -ForegroundColor White

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`n🔥 IF FIREWALL BLOCKS ACCESS:" -ForegroundColor Red
Write-Host "`nRun these commands in PowerShell AS ADMINISTRATOR:`n" -ForegroundColor Yellow

Write-Host "   New-NetFirewallRule -DisplayName 'Music Player Frontend' ``" -ForegroundColor Cyan
Write-Host "       -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow`n" -ForegroundColor Cyan

Write-Host "   New-NetFirewallRule -DisplayName 'Music Player Backend' ``" -ForegroundColor Cyan
Write-Host "       -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow`n" -ForegroundColor Cyan

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`n🎯 QUICK TEST:" -ForegroundColor Green
Write-Host "   On your phone, open browser and visit:" -ForegroundColor White
Write-Host "   http://${primaryIP}:3000`n" -ForegroundColor Yellow

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`n📋 COPY THIS URL TO YOUR PHONE:" -ForegroundColor Cyan
Write-Host "`n   http://${primaryIP}:3000" -ForegroundColor Yellow -BackgroundColor DarkMagenta
Write-Host ""

# Try to create QR code URL (optional - for easy scanning)
$qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://${primaryIP}:3000"
Write-Host "📷 QR CODE (scan with phone):" -ForegroundColor Cyan
Write-Host "   Open this URL on your computer to see QR code:" -ForegroundColor White
Write-Host "   $qrUrl`n" -ForegroundColor Blue

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`nWould you like to:" -ForegroundColor Yellow
Write-Host "  1. Add firewall rules now (requires admin)" -ForegroundColor White
Write-Host "  2. Open QR code in browser" -ForegroundColor White
Write-Host "  3. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1/2/3)"

switch ($choice) {
    "1" {
        Write-Host "`n⚠️ Opening PowerShell as Administrator...`n" -ForegroundColor Yellow
        $script = @"
New-NetFirewallRule -DisplayName 'Music Player Frontend' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName 'Music Player Backend' -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow
Write-Host '✅ Firewall rules added!' -ForegroundColor Green
pause
"@
        Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-Command", $script
    }
    "2" {
        Write-Host "`n📷 Opening QR code in browser...`n" -ForegroundColor Cyan
        Start-Process $qrUrl
    }
    "3" {
        Write-Host "`n👋 Goodbye!`n" -ForegroundColor Green
    }
}

Write-Host "`nHappy listening on your mobile!`n" -ForegroundColor Green
