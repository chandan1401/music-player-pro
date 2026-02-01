# Jam Session - Quick Reference

## 🚀 Quick Start

### Start Both Servers
```bash
# Option 1: Run batch file (Windows)
start-jam-session.bat

# Option 2: Manual start
# Terminal 1
cd backend
npm install
npm start

# Terminal 2  
cd frontend
npm install
npm run dev
```

### Access the App
- Frontend: `http://localhost:5001` or `http://localhost:3000`
- Backend API: `http://localhost:4000`
- WebSocket: `ws://localhost:4000`

---

## 📋 Common Tasks

### Create a Session
1. Click "🎸 Jam Session" button
2. Click "🎸 Create New Session"
3. Enter your name
4. Copy the 6-character code

### Join a Session
1. Click "🎸 Jam Session"
2. Click "🎤 Join Existing Session"  
3. Enter code + your name
4. Click "Join Session"

### Add Songs to Queue
- Search in right sidebar
- Click "+" on any song
- Use "🤖 AI Suggestions" for smart recommendations

### Vote on Songs
- 👍 = Upvote (moves song up)
- 👎 = Downvote (moves song down)
- Click again to remove vote

### Control Playback (Host Only)
- "▶️ Start" - Begin playing queue
- "⏭️ Next Song" - Skip to next
- Playback syncs to all users

---

## 🔌 API Quick Reference

### REST Endpoints

```http
# Create session
POST /api/jam/create
Body: { "hostName": "John" }
Returns: { "sessionCode": "ABC123", "hostId": "...", "session": {...} }

# Get session info
GET /api/jam/session/:code
Returns: { "session": {...} }

# List active sessions
GET /api/jam/active-sessions
Returns: { "sessions": [...] }
```

### Socket Events (Emit)

```javascript
// Join session
socket.emit('join-session', {
  sessionCode: 'ABC123',
  userName: 'John',
  userId: 'optional-id'
});

// Leave session
socket.emit('leave-session');

// Add to queue
socket.emit('add-to-queue', { song: {...} });

// Vote (1 = up, -1 = down, 0 = remove)
socket.emit('vote', { queueItemId: 'id', voteValue: 1 });

// Remove from queue
socket.emit('remove-from-queue', { queueItemId: 'id' });

// Play next (host only)
socket.emit('play-next');

// Get AI recommendations
socket.emit('get-recommendations', { allSongs: [...] });
```

### Socket Events (Listen)

```javascript
// Session joined
socket.on('session-joined', (data) => {
  // data: { session: {...}, userId: '...' }
});

// Queue updated
socket.on('queue-updated', (data) => {
  // data: { queue: [...] }
});

// Now playing
socket.on('now-playing', (data) => {
  // data: { song: {...}, queue: [...] }
});

// Participant joined
socket.on('participant-joined', (data) => {
  // data: { participant: {...}, participantCount: N }
});

// Participant left
socket.on('participant-left', (data) => {
  // data: { userId: '...', newHost: boolean, hostId: '...' }
});

// AI recommendations
socket.on('recommendations', (data) => {
  // data: { songs: [...] }
});

// Playback sync (non-host)
socket.on('playback-sync', (state) => {
  // state: { isPlaying: true, currentTime: 42.5, ... }
});

// Error
socket.on('error', (data) => {
  // data: { message: '...' }
});
```

---

## 📦 File Structure

```
music-player/
├── backend/
│   ├── server.js                 # Main server + Socket.IO setup
│   ├── routes/
│   │   └── jamSession.js         # ⭐ Jam session logic
│   ├── package.json              # Added: socket.io
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # ⭐ Updated: JamSession integration
│   │   └── Components/
│   │       └── JamSession.jsx    # ⭐ NEW: Main component
│   ├── package.json              # Added: socket.io-client
│   └── ...
│
├── JAM_SESSION_GUIDE.md          # Complete documentation
├── JAM_SESSION_ARCHITECTURE.md   # Technical details
└── start-jam-session.bat         # Quick start script
```

---

## 🎨 UI Components

### JamSession States
```
State 1: Welcome Screen
├── Create Session Form
└── Join Session Form

State 2: Active Session
├── Header (code, participants, leave)
├── Left: Participants List
├── Center: Now Playing + Queue
└── Right: Add Songs + AI
```

### Queue Item Structure
```
┌─────────────────────────────────────────┐
│ [#] Song Title                    👍 5  │
│     Artist • Added by John         👎   │
│                                    [🗑️]  │
└─────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Backend Settings (jamSession.js)
```javascript
settings: {
  allowVoting: true,        // Enable/disable voting
  maxQueueSize: 50,         // Max songs in queue
  autoPlay: true,           // Auto-play next song
  skipThreshold: 0.5        // % needed to skip
}
```

### Cleanup Settings
```javascript
SESSION_TIMEOUT = 30 * 60 * 1000;  // 30 minutes
CLEANUP_INTERVAL = 5 * 60 * 1000;   // 5 minutes
```

---

## 🐛 Debugging

### Check Backend
```bash
# Is server running?
curl http://localhost:4000/health
# Should return: {"status":"ok","uptime":...}

# Create test session
curl -X POST http://localhost:4000/api/jam/create \
  -H "Content-Type: application/json" \
  -d '{"hostName":"Test"}'
```

### Check Frontend
```javascript
// In browser console
localStorage.getItem('debug')  // Check debug mode
// Enable debug logs
localStorage.setItem('debug', 'socket.io-client:*')
```

### Common Issues

**Can't connect to session**
- Check backend is running (port 4000)
- Verify session code is correct
- Session may have expired (30 min)

**Votes not working**
- Ensure you're in the session
- Check you haven't already voted
- Voting must be enabled

**Playback not syncing**
- Only host controls playback
- Check WebSocket connection
- Verify CORS settings

---

## 💡 Pro Tips

### For Users
- Session codes are case-insensitive (ABC123 = abc123)
- Use AI recommendations to match session vibe
- Higher voted songs play first
- Host can remove any song, users can only remove their own

### For Developers
- Sessions are in-memory (restart = all sessions lost)
- Use Redis for production persistence
- Socket.IO rooms handle session isolation
- Queue auto-sorts on every vote change

### Performance
- Recommended: 50 users max per session
- Queue limit: 50 songs
- Sessions cleanup after 30 min inactive
- Use HTTP/2 for better WebSocket performance

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:4000/health
```

### Active Sessions
```bash
curl http://localhost:4000/api/jam/active-sessions
```

### Console Logs (Backend)
```
Client connected: <socketId>
Client disconnected: <socketId>
Deleted empty session: <code>
Cleaned up stale session: <code>
```

---

## 🔐 Security Notes

- Session codes: 2.1B combinations (6 chars)
- No authentication required
- CORS restricted to allowed origins
- Rate limiting: 100 req/min per IP
- Max payload: 1KB JSON

---

## 🚢 Production Deployment

### Must-Do
1. Set `NODE_ENV=production`
2. Use HTTPS/WSS
3. Configure proper CORS origins
4. Switch to Redis for sessions
5. Enable rate limiting
6. Set up monitoring/logging

### Recommended
- Use load balancer with sticky sessions
- Configure WebSocket ping/pong
- Implement graceful shutdown
- Add session backups
- Set up CDN for static files

---

## 📞 Support & Resources

### Documentation
- `JAM_SESSION_GUIDE.md` - Complete guide
- `JAM_SESSION_ARCHITECTURE.md` - Technical deep dive
- `INTEGRATION_DESIGN.md` - Integration notes

### Dependencies
- `socket.io` (backend) - WebSocket library
- `socket.io-client` (frontend) - WebSocket client
- `express` - Web server
- `react` - UI framework

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test
```

---

## 🎯 Feature Checklist

✅ Create/join sessions
✅ Real-time sync
✅ Voting system
✅ Queue management
✅ Host controls
✅ AI recommendations
✅ Participant list
✅ Notifications
✅ Session cleanup
✅ Host migration

---

## 📝 Version Info

- **Version**: 1.0.0
- **Date**: December 10, 2025
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: React + Socket.IO Client
- **Protocol**: WebSocket (Socket.IO)

---

**Happy Jamming! 🎵🎸**
