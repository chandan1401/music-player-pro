# 🎵 Music Player - Quick Start Guide

## ✨ EASIEST WAY TO RUN

Just **double-click** one of these files:

### Option 1: Batch File (Recommended)
📄 **`START_MUSIC_PLAYER.bat`** - Double-click to start everything!

### Option 2: PowerShell Script
📄 **`START_MUSIC_PLAYER.ps1`** - Right-click → Run with PowerShell

---

## 🎯 What It Does Automatically

✅ Kills old processes  
✅ Checks and installs dependencies  
✅ Starts Backend (Port 4000)  
✅ Starts Frontend (Port 5173, fallback 3000)  
✅ Opens browser automatically  
✅ Optional: Starts Emotion API for mood detection  

---

## 🚀 Manual Start (If Needed)

If you prefer to start manually:

```bash
# Backend
cd backend
npm install
npm start

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Emotion API (optional, new terminal)
cd emotion-music-generator2\src
pip install -r ../requirements.txt
python emotion_api.py
```

---

## 📝 Server Ports

- **Backend:** http://localhost:4000
- **Frontend:** http://localhost:5173 (or http://localhost:3000)
- **Emotion API:** http://localhost:5001 (optional)

---

## 🎭 Features

### Regular Music Player
- Browse songs by genre
- Create and manage playlists
- Search songs
- Audio visualization
- Lyrics display

### Mood-Based Music 🆕
1. **Manual Selection:** Click mood buttons (Happy, Sad, Angry, etc.)
2. **Camera Detection:** AI analyzes your face and plays matching music

### Jam Session
- Collaborate with friends
- Synchronized playback
- Real-time song queue

---

## ❗ Troubleshooting

### "Port already in use"
Close all server windows and run the starter script again.

### Frontend not opening
Try both URLs:
- `http://localhost:5173`
- `http://localhost:3000`

Vite may choose either port depending on availability.

### Frontend shows errors
Wait 10-15 seconds for backend to fully start, then refresh browser.

### Emotion API not working
1. Check the "EMOTION API - PORT 5001" window for errors
2. Install Python dependencies: `cd emotion-music-generator2 && pip install -r requirements.txt`

### Dependencies missing
The starter script automatically installs them, but you can manually run:
```bash
cd backend && npm install
cd frontend && npm install
```

---

## 🛑 How to Stop

Close the CMD/PowerShell windows titled:
- BACKEND API - PORT 4000
- FRONTEND - PORT 3000
- EMOTION API - PORT 5001

---

## 💡 Tips

- **First time running:** May take 30-60 seconds to install dependencies
- **Mood detection:** Wait 30 seconds for Emotion API to load TensorFlow
- **No camera?** Use manual mood selector buttons instead
- **Best experience:** Use Chrome or Edge browser

---

## 🎉 Enjoy Your Music! 🎵
