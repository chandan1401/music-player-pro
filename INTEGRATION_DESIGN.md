# Mood-Based Music Integration Design Document

## Overview
Integration between **Music Player Pro** (frontend/backend) and **Emotion Music Generator** (Python emotion detection) to automatically play mood-matching songs based on real-time facial emotion detection.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           User Browser (localhost:3000)                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ React Frontend (Vite)                                                │   │
│  │   • MoodPlayer Component (camera access, mood detection button)     │   │
│  │   • Player Component (audio playback)                               │   │
│  │   • App.jsx (main controller)                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                │                                    │
                │ POST /api/detect-mood              │ POST /api/mood-play
                │ (base64 image)                     │ { mood: "happy" }
                ▼                                    ▼
┌──────────────────────────┐        ┌─────────────────────────────────────────┐
│ Emotion Service (Flask)  │        │ Music Player Backend (Express)          │
│ localhost:5001           │        │ localhost:4000                          │
│                          │        │                                          │
│ POST /api/detect-mood    │        │ POST /api/mood-play                      │
│ → { mood, confidence }   │        │ → { song: { id, title, artist, url } }  │
│                          │        │                                          │
│ Uses: DeepFace          │        │ Uses: songs.json + moods.json            │
└──────────────────────────┘        └─────────────────────────────────────────┘
```

---

## API Contract

### 1. Emotion Detection API (Flask - Port 5001)

**Endpoint:** `POST /api/detect-mood`

**Request:**
```json
{
  "image": "<base64-encoded-jpeg-image>"
}
```

**Response (Success):**
```json
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

**Response (Error):**
```json
{
  "error": "No face detected",
  "mood": null
}
```

### 2. Mood-Based Song Selection API (Express - Port 4000)

**Endpoint:** `POST /api/mood-play`

**Request:**
```json
{
  "mood": "happy"
}
```

**Response (Success):**
```json
{
  "song": {
    "id": 1,
    "title": "Love Dose",
    "artist": "Yo Yo Honey Singh",
    "url": "http://localhost:4000/media/songs/Love Dose [128 Kbps]-(SongsPk.com.se).mp3",
    "cover": "http://localhost:4000/media/images/love dose.jpg",
    "genre": "pop",
    "duration": 195
  }
}
```

**Response (Error):**
```json
{
  "error": "mood required"
}
```

---

## Mood → Song Mapping Strategy

### Supported Moods
Based on DeepFace emotion detection:
- `happy` → Upbeat, energetic songs (pop, energetic)
- `sad` → Soothing, romantic songs (romantic, lofi)
- `angry` → High-energy songs (pop, energetic)
- `neutral` → Balanced selection (any genre)
- `surprise` → Fun, upbeat songs (pop)
- `fear` → Calming songs (lofi, romantic)
- `disgust` → Neutral/calming songs

### Mapping Implementation
File: `backend/data/moods.json`

```json
{
  "1": ["happy", "surprise", "neutral"],
  "2": ["neutral", "happy"],
  "4": ["happy", "angry", "surprise"],
  ...
}
```

Key = Song ID, Value = Array of matching moods

---

## Modified Files List

### Music Player Pro (Backend - Node/Express)

| File | Action | Description |
|------|--------|-------------|
| `backend/server.js` | Modified | Add CORS for port 5001, wire mood-play router |
| `backend/routes/moodPlay.js` | **New** | POST /api/mood-play endpoint |
| `backend/data/moods.json` | **New** | Song-to-mood mappings |

### Music Player Pro (Frontend - React/Vite)

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/App.jsx` | Modified | Import and render MoodPlayer component |
| `frontend/src/Components/MoodPlayer.jsx` | **New** | Camera access, emotion detection, play trigger |

### Emotion Music Generator (Python/Flask)

| File | Action | Description |
|------|--------|-------------|
| `emotion-music-generator2/src/emotion_api.py` | **New** | Flask API server with /api/detect-mood |
| `emotion-music-generator2/requirements.txt` | Modified | Add flask, flask-cors |

---

## Deployment & Ports

| Service | Port | Command |
|---------|------|---------|
| Music Player Frontend | 3000 | `cd frontend && npm run dev` |
| Music Player Backend | 4000 | `cd backend && npm start` |
| Emotion Detection API | 5001 | `cd emotion-music-generator2/src && python emotion_api.py` |

### CORS Configuration

**Backend (Express):**
- Allow origins: `http://localhost:3000`, `http://localhost:5001`
- Allow methods: `GET, POST` (POST only for mood-play endpoint)

**Emotion API (Flask):**
- Allow origins: `http://localhost:3000`
- Allow methods: `POST`

---

## User Flow

1. User clicks **"🎭 Music from Mood"** button in the header
2. Browser requests camera permission
3. MoodPlayer component shows camera preview
4. User clicks **"Detect Mood"** button
5. Frontend captures frame, converts to base64
6. Frontend POSTs to `http://localhost:5001/api/detect-mood`
7. Flask service runs DeepFace emotion detection
8. Frontend receives mood (e.g., "happy")
9. Frontend POSTs to `http://localhost:4000/api/mood-play` with mood
10. Backend returns matching song with full URL
11. Frontend triggers Player component to play the song
12. User hears mood-matching music!

---

## Testing Steps

### Manual Testing

1. **Start all services:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm start
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   
   # Terminal 3 - Emotion API
   cd emotion-music-generator2/src && python emotion_api.py
   ```

2. **Test mood-play endpoint:**
   ```bash
   curl -X POST http://localhost:4000/api/mood-play \
     -H "Content-Type: application/json" \
     -d '{"mood": "happy"}'
   ```

3. **Test emotion detection:**
   ```bash
   # Use browser or send base64 image
   curl -X POST http://localhost:5001/api/detect-mood \
     -H "Content-Type: application/json" \
     -d '{"image": "<base64-jpeg>"}'
   ```

4. **End-to-end test:**
   - Open http://localhost:3000
   - Click "🎭 Music from Mood" button
   - Allow camera access
   - Click "Detect Mood"
   - Verify song plays automatically

---

## Feature Flags

The mood integration is additive and non-destructive:
- New button in header (does not modify existing UI)
- New API endpoint (does not affect existing /api/songs)
- Optional moods.json (fallback to random song if missing)

---

## Dependencies Added

### Backend (npm)
None - uses existing Express setup

### Emotion API (pip)
```
flask>=2.3.0
flask-cors>=4.0.0
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| No camera access | Show error message, hide detection UI |
| No face detected | Show "No face detected, try again" |
| Emotion API down | Show error, suggest manual mood selection |
| No songs for mood | Fallback to random song from library |
| Backend API down | Show connection error message |

---

## Security Considerations

1. Camera access requires HTTPS in production (localhost exempt)
2. Base64 image only sent to emotion API (no storage)
3. CORS restricted to specific origins
4. Rate limiting on backend prevents abuse
