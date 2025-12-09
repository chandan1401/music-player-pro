# Music Player Pro 🎵

A modern, feature-rich music player with AI-powered mood-based song recommendations.

## Features

- 🎵 **Clean Music Player** - Play, pause, skip, shuffle, repeat
- 🔍 **Search & Filter** - Find songs by title, artist, or genre
- 📋 **Playlists** - Create and manage custom playlists
- ❤️ **Favorites** - Mark your favorite songs
- 🎨 **Themes** - Multiple color themes (Dark, Ocean, Purple, Red, Cyberpunk)
- 📊 **Stats** - Track your listening history
- 🎭 **Mood Detection** - AI-powered emotion-based song recommendations

---

## Mood Integration 🎭

The Music Player Pro now integrates with an AI-powered emotion detection service to automatically play songs that match your current mood!

### How It Works

1. Click the **"🎭 Music from Mood"** button in the header
2. Allow camera access when prompted
3. Position your face in the camera view
4. Click **"Detect My Mood"**
5. The AI analyzes your facial expression and detects your emotion
6. A song matching your mood plays automatically!

### Supported Moods

| Mood | Song Style |
|------|------------|
| 😊 Happy | Upbeat, energetic pop songs |
| 😢 Sad | Soothing, romantic melodies |
| 😠 Angry | High-energy tracks |
| 😲 Surprise | Fun, upbeat selections |
| 😨 Fear | Calming, relaxing music |
| 🤢 Disgust | Neutral, calming songs |
| 😐 Neutral | Balanced mix of all genres |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React/Vite)          localhost:3000              │
│  ├── MoodPlayer component (camera, mood detection)          │
│  └── Player component (audio playback)                      │
└─────────────────────────────────────────────────────────────┘
           │                              │
           │ POST /api/detect-mood        │ POST /api/mood-play
           ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────────┐
│ Emotion API (Flask)  │    │ Backend (Express)               │
│ localhost:5001       │    │ localhost:4000                  │
│ DeepFace AI          │    │ Song matching + streaming       │
└──────────────────────┘    └─────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- Webcam (for mood detection)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chandan1401/music-player-pro.git
   cd music-player-pro
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Install emotion detection dependencies**
   ```bash
   cd emotion-music-generator2
   pip install -r requirements.txt
   ```

### Running the Application

Start all three services:

**Terminal 1 - Backend API (port 4000)**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend (port 3000)**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Emotion Detection API (port 5001)**
```bash
cd emotion-music-generator2/src
python emotion_api.py
```

Open http://localhost:3000 in your browser.

---

## API Endpoints

### Music Player Backend (port 4000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/songs` | Get all songs |
| GET | `/api/playlists` | Get all playlists |
| POST | `/api/mood-play` | Get song by mood |
| GET | `/media/*` | Stream audio/images |

**POST /api/mood-play**
```json
// Request
{ "mood": "happy" }

// Response
{
  "song": {
    "id": 4,
    "title": "Love Dose",
    "artist": "Yo Yo Honey Singh",
    "url": "http://localhost:4000/media/songs/Love Dose.mp3",
    "cover": "http://localhost:4000/media/images/love dose.jpg",
    "genre": "pop",
    "duration": 195
  }
}
```

### Emotion Detection API (port 5001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/detect-mood` | Detect emotion from image |
| GET | `/api/health` | Health check |
| GET | `/api/supported-moods` | List supported moods |

**POST /api/detect-mood**
```json
// Request
{ "image": "<base64-encoded-jpeg>" }

// Response
{
  "mood": "happy",
  "confidence": 0.85,
  "allEmotions": {
    "angry": 0.02,
    "disgust": 0.01,
    "fear": 0.03,
    "happy": 0.85,
    "neutral": 0.05,
    "sad": 0.02,
    "surprise": 0.02
  }
}
```

---

## Project Structure

```
music-player-pro/
├── backend/                    # Express.js backend
│   ├── server.js              # Main server file
│   ├── songs.json             # Song database
│   ├── routes/
│   │   └── moodPlay.js        # Mood-based song endpoint
│   ├── data/
│   │   └── moods.json         # Song-to-mood mappings
│   └── public/                # Static media files
│       ├── songs/
│       └── images/
│
├── frontend/                   # React/Vite frontend
│   └── src/
│       ├── App.jsx            # Main application
│       └── Components/
│           ├── MoodPlayer.jsx # Mood detection UI
│           ├── player.jsx     # Audio player
│           ├── Songlist.jsx   # Song list view
│           └── ...
│
├── emotion-music-generator2/   # Python emotion detection
│   ├── requirements.txt
│   └── src/
│       ├── emotion_api.py     # Flask API server
│       └── emotion_detector.py # DeepFace integration
│
└── INTEGRATION_DESIGN.md      # Technical design document
```

---

## Testing

### Test Mood-Play Endpoint
```bash
curl -X POST http://localhost:4000/api/mood-play \
  -H "Content-Type: application/json" \
  -d '{"mood": "happy"}'
```

### Test Emotion Detection API
```bash
curl http://localhost:5001/api/health
```

### End-to-End Test
1. Open http://localhost:3000
2. Click "🎭 Music from Mood"
3. Allow camera access
4. Click "Detect My Mood"
5. Verify a song plays automatically

---

## Configuration

### Ports
| Service | Default Port |
|---------|-------------|
| Frontend | 3000 |
| Backend | 4000 |
| Emotion API | 5001 |

### CORS
The backend allows requests from:
- `http://localhost:3000` (frontend)
- `http://localhost:5001` (emotion API)

---

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Made with ❤️ by [chandan1401](https://github.com/chandan1401)
