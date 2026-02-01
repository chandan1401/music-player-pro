# Mobile Access Guide

## Your Music Player is now accessible from your phone!

### Your Computer's IP Address:
**192.168.144.1**

### Mobile Access URL:
**http://192.168.144.1:3000**

---

## How to Access from Mobile Phone:

### Step 1: Connect to Same WiFi
- Make sure your **phone** and **computer** are on the **SAME WiFi network**

### Step 2: Open Browser on Phone
- Open any browser (Chrome, Safari, Firefox, Edge)

### Step 3: Enter URL
Type this in the address bar:
```
http://192.168.144.1:3000
```

### Step 4: Bookmark It!
- Save it to your home screen for easy access
- Works just like the desktop version!

---

## Firewall Setup (If Blocked)

If you can't access from your phone, Windows Firewall might be blocking it.

**Run PowerShell AS ADMINISTRATOR and execute:**

```powershell
New-NetFirewallRule -DisplayName "Music Player Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

New-NetFirewallRule -DisplayName "Music Player Backend" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow
```

---

## Features That Work on Mobile:

✅ Browse all songs  
✅ Play/pause music  
✅ Create playlists  
✅ Search songs  
✅ Mood-based music (manual selection)  
✅ Jam Session (join as guest or host)  
✅ Volume control  
✅ Lyrics display  

⚠️ Camera mood detection may not work on all mobile browsers

---

## Troubleshooting:

### "Can't reach this page"
- **Check WiFi:** Phone and computer on same network?
- **Check Servers:** Are backend & frontend running?
- **Check Firewall:** Run firewall commands above
- **Check IP:** Your IP might change. Re-run MOBILE_ACCESS.ps1

### "Music won't play"
- Some mobile browsers block autoplay
- Tap the play button manually first
- Use Chrome or Safari for best compatibility

### "Controls not responding"
- Refresh the page (swipe down)
- Clear browser cache
- Try a different browser

---

## Share with Friends:

Anyone on your WiFi network can access:
- **http://192.168.144.1:3000**

Perfect for parties! Everyone can:
- See the song list
- Join Jam Sessions
- Vote on songs
- Add their favorites

---

## Mobile Tips:

1. **Add to Home Screen:**
   - Chrome: Menu → Add to Home Screen
   - Safari: Share → Add to Home Screen
   
2. **Portrait Mode Works Best**
   - UI is responsive
   - Works in landscape too

3. **Save Bandwidth:**
   - Audio streams from your computer
   - No internet data used (only WiFi)

4. **Multiple Devices:**
   - Access from multiple phones/tablets
   - All on same WiFi
   - Great for Jam Sessions!

---

## Your Music Player URLs:

**From This Computer:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

**From Mobile/Other Devices:**
- Frontend: http://192.168.144.1:3000
- Backend: http://192.168.144.1:4000

---

## Quick Start:

1. Double-click **START_MUSIC_PLAYER.bat** on computer
2. On phone, go to **http://192.168.144.1:3000**
3. Enjoy your music anywhere in your home! 🎵

---

**Note:** IP address may change if computer reconnects to WiFi. Re-run MOBILE_ACCESS.ps1 to get updated IP.
