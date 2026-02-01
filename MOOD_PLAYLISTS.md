# 🎭 Mood-Based Playlists

The music player now includes **intelligent mood-based playlists** that automatically play songs matching your detected emotion!

## 📋 Available Mood Playlists

### 😊 Happy - "Happy Vibes"
**Upbeat and energetic songs to lift your spirits**
- Dhun
- Khoobsurat
- Love Dose
- Tum Ho Toh
- Tu Aashiqui Hai
- Mera Pehla Pehla Pyaar
- Soniye

### 😢 Sad - "Melancholy Moments"
**Soothing and emotional songs for reflective times**
- Darshan Raval Lofi Mashup
- Mera Hua
- Saiyaara Reprise
- Blue
- Chahoon Tujhe
- Khuda Jaane
- Teri Yaadon Mein
- Kya Mujhe Pyar Hai
- Labon Ko

### 😠 Angry - "Power Surge"
**High-energy tracks to channel your intensity**
- Love Dose
- Blue

### 😐 Neutral - "Balanced Mix"
**A balanced selection for a calm state of mind**
- Darshan Raval Lofi Mashup
- Dhun
- Mera Hua
- Saiyaara Reprise
- Tum Ho Toh
- Chahoon Tujhe
- Khuda Jaane
- Teri Yaadon Mein
- Tu Aashiqui Hai
- Kya Mujhe Pyar Hai
- Mera Pehla Pehla Pyaar

### 😲 Surprise - "Unexpected Delights"
**Fun and upbeat selections for moments of surprise**
- Khoobsurat
- Love Dose
- Tum Ho Toh
- Tu Aashiqui Hai
- Mera Pehla Pehla Pyaar
- Soniye

### 😨 Fear - "Calming Refuge"
**Relaxing music to ease anxiety and fear**
- Darshan Raval Lofi Mashup
- Mera Hua
- Saiyaara Reprise
- Blue
- Khuda Jaane

### 🤢 Disgust - "Mood Cleanser"
**Neutral, calming songs to reset your mood**
- Dhun
- Tum Ho Toh
- Chahoon Tujhe
- Teri Yaadon Mein
- Kya Mujhe Pyar Hai

## 🎵 How It Works

1. **Emotion Detection**: The camera captures your facial expression
2. **AI Analysis**: DeepFace AI analyzes your emotion (happy, sad, angry, etc.)
3. **Playlist Selection**: The backend selects the appropriate mood playlist
4. **Random Song**: A random song from that playlist is chosen and played
5. **Auto-Play**: The song starts playing automatically!

## 🔧 Technical Details

### API Endpoints

**POST /api/mood-play**
```json
// Request
{
  "mood": "happy"
}

// Response
{
  "song": {
    "id": 4,
    "title": "Love Dose",
    "artist": "Yo Yo Honey Singh",
    "url": "http://localhost:4000/media/songs/Love Dose.mp3",
    "cover": "http://localhost:4000/media/images/love dose.jpg",
    "genre": "pop",
    "duration": 195,
    "path": "songs/Love Dose.mp3"
  },
  "requestedMood": "happy",
  "totalCandidates": 7,
  "playlistUsed": "Happy Vibes"
}
```

**GET /api/mood-play/playlists**
```json
// Response
{
  "playlists": {
    "happy": {
      "name": "Happy Vibes",
      "description": "Upbeat and energetic songs to lift your spirits",
      "songIds": [2, 3, 4, 7, 12, 15, 16],
      "songs": [
        { "id": 2, "title": "Dhun", "artist": "Various Artists", "genre": "pop" },
        ...
      ]
    },
    ...
  }
}
```

### File Structure

```
backend/
├── data/
│   ├── moodPlaylists.json    # Mood-based playlist definitions
│   └── moods.json             # Legacy mood mappings (fallback)
├── routes/
│   └── moodPlay.js           # Mood detection API route
└── songs.json                # All available songs
```

## 🎨 Customizing Playlists

Edit `backend/data/moodPlaylists.json` to customize which songs play for each mood:

```json
{
  "happy": {
    "name": "Happy Vibes",
    "description": "Your custom description",
    "songIds": [2, 3, 4, 7, 12, 15, 16]
  }
}
```

Just add or remove song IDs from the `songIds` array!

## 🚀 Usage

1. Start all three servers:
   - Backend: `cd backend && npm start`
   - Frontend: `cd frontend && npm run dev`
   - Emotion API: `cd emotion-music-generator2/src && python emotion_api.py`

2. Open the app and click **"🎭 Music from Mood"**

3. Choose your method:
   - **📷 Detect with Camera**: AI analyzes your face
   - **🎯 Select Mood**: Manually pick your mood

4. Enjoy music that matches your emotion!

## 📊 Statistics

- **7 Mood Categories**: happy, sad, angry, neutral, surprise, fear, disgust
- **16 Total Songs**: Curated from your music library
- **Smart Fallback**: If no mood match, plays a random song
- **Real-time Detection**: Instant emotion analysis with DeepFace AI

---

**Tip**: The more songs you add to each mood playlist, the more variety you'll get when that emotion is detected!
