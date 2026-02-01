# 🎵 How to Add Songs to Your Music Player

## 📁 Folder Structure

Organize your songs by mood in these folders:

```
songs/
├── Happy Songs/       ← Add upbeat, energetic songs here
├── Sad Songs/         ← Add emotional, melancholic songs here
├── Angry Songs/       ← Add high-energy, intense songs here
├── Neutral Songs/     ← Add calm, balanced songs here
└── Best of KK/        ← Or create your own artist/playlist folders
```

## 📝 Step-by-Step Guide

### 1. Add Your MP3 Files
Copy your MP3 files to the appropriate mood folder:
- **Happy Songs/** - Upbeat, cheerful music
- **Sad Songs/** - Emotional, soothing music
- **Angry Songs/** - High-energy, intense music
- **Neutral Songs/** - Calm, balanced music

### 2. Add Cover Images (Optional)
Place album art (JPG/PNG) in the corresponding image folder:
```
images/
├── Happy Songs/
├── Sad Songs/
├── Angry Songs/
└── Neutral Songs/
```

### 3. Update songs.json
Edit `backend/songs.json` and add your song entry:

```json
{
  "id": 17,
  "title": "Your Song Name",
  "artist": "Artist Name",
  "genre": "pop",
  "path": "songs/Happy Songs/your-song.mp3",
  "cover": "images/Happy Songs/cover.jpg",
  "duration": 240
}
```

### 4. Update Mood Playlists
Edit `backend/data/moodPlaylists.json` to include your song in mood-based playback:

```json
{
  "happy": {
    "songIds": [2, 3, 4, 7, 12, 15, 16, 17]  ← Add your song ID
  }
}
```

### 5. Restart Backend Server
After adding songs, restart the backend:
```powershell
cd backend
npm start
```

## 🎭 Mood Categories

| Mood | Folder | Best For |
|------|--------|----------|
| 😊 Happy | Happy Songs/ | Pop, dance, upbeat tracks |
| 😢 Sad | Sad Songs/ | Ballads, emotional songs |
| 😠 Angry | Angry Songs/ | Rock, metal, high-energy |
| 😐 Neutral | Neutral Songs/ | Lofi, instrumental, calm |

## ✅ Example

**Adding a happy song:**
1. Copy `sunshine-day.mp3` → `songs/Happy Songs/`
2. Copy `sunshine-cover.jpg` → `images/Happy Songs/`
3. Add to `songs.json`:
```json
{
  "id": 17,
  "title": "Sunshine Day",
  "artist": "Happy Band",
  "genre": "pop",
  "path": "songs/Happy Songs/sunshine-day.mp3",
  "cover": "images/Happy Songs/sunshine-cover.jpg",
  "duration": 180
}
```
4. Add `17` to happy playlist in `moodPlaylists.json`
5. Restart backend

## 🎵 Supported Formats
- **Audio**: MP3 (recommended), WAV
- **Images**: JPG, PNG (square format recommended)

---

**Tip**: Keep file names simple without special characters for best compatibility!
