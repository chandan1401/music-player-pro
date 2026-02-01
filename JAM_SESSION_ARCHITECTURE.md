# Jam Session - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSERS                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │  User 1    │  │  User 2    │  │  User 3    │                │
│  │  (Host)    │  │            │  │            │                │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                │
└────────┼───────────────┼───────────────┼────────────────────────┘
         │               │               │
         │    HTTP/WS    │    HTTP/WS    │    HTTP/WS
         │               │               │
         └───────────────┴───────────────┘
                         │
┌────────────────────────┼────────────────────────────────────────┐
│                        ▼                                         │
│               ┌─────────────────┐                                │
│               │  Express Server │                                │
│               │   (Port 4000)   │                                │
│               └────────┬────────┘                                │
│                        │                                         │
│         ┌──────────────┼──────────────┐                         │
│         │              │              │                         │
│    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐                    │
│    │  REST   │   │ Socket  │   │  File   │                    │
│    │   API   │   │  .IO    │   │  Serve  │                    │
│    └────┬────┘   └────┬────┘   └─────────┘                    │
│         │              │                                         │
│         │              │                                         │
│    ┌────▼──────────────▼──────┐                                │
│    │  Session Management      │                                │
│    │  (In-Memory Map)         │                                │
│    │                          │                                │
│    │  ┌────────────────────┐  │                                │
│    │  │ JamSession Class   │  │                                │
│    │  │                    │  │                                │
│    │  │ - participants     │  │                                │
│    │  │ - queue           │  │                                │
│    │  │ - currentSong     │  │                                │
│    │  │ - playbackState   │  │                                │
│    │  │ - voting          │  │                                │
│    │  │ - AI recommender  │  │                                │
│    │  └────────────────────┘  │                                │
│    └───────────────────────────┘                                │
│                  SERVER                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Session Creation Flow

```
User                 Frontend              Backend
 │                      │                     │
 │─────[Enter Name]────>│                     │
 │                      │                     │
 │                      │──POST /api/jam/create─>│
 │                      │    {hostName: "John"}  │
 │                      │                         │
 │                      │                         │ Generate Code
 │                      │                         │ Create Session
 │                      │                         │
 │                      │<────Response──────────── │
 │                      │  {sessionCode: "ABC123"} │
 │                      │                          │
 │                      │──[join-session via WS]──>│
 │                      │                          │
 │                      │<──[session-joined]────── │
 │<─[Display Session]───│                          │
 │    Code: ABC123      │                          │
```

### 2. Join Session Flow

```
User 2               Frontend              Backend
 │                      │                     │
 │─[Enter Code+Name]───>│                     │
 │                      │                     │
 │                      │──GET /api/jam/session/ABC123──>│
 │                      │                                 │
 │                      │<────[Session Details]───────────│
 │                      │                                 │
 │                      │──[join-session via WS]─────────>│
 │                      │  {code, userName}               │
 │                      │                                 │
 │                      │                                 │ Add to participants
 │                      │                                 │
 │                      │<──[session-joined]──────────────│
 │                      │                                 │
 │                      │                                 │ Broadcast to all
 │                      │<══[participant-joined]══════════│
 │<──[View Session]─────│                                 │
```

### 3. Add Song to Queue Flow

```
User                 Frontend              Backend              All Users
 │                      │                     │                    │
 │─[Click + on Song]───>│                     │                    │
 │                      │                     │                    │
 │                      │─[add-to-queue]─────>│                    │
 │                      │  {song: {...}}      │                    │
 │                      │                     │                    │
 │                      │                     │ Add to queue       │
 │                      │                     │ Sort by votes      │
 │                      │                     │                    │
 │                      │                     │═[queue-updated]══> │
 │                      │<════════════════════╪════════════════════│
 │<──[Queue Updated]────│                     │                    │
 │    with new song     │                     │                    │
```

### 4. Voting Flow

```
User                 Frontend              Backend              All Users
 │                      │                     │                    │
 │─[Click 👍]──────────>│                     │                    │
 │                      │                     │                    │
 │                      │─[vote]─────────────>│                    │
 │                      │  {itemId, value: 1} │                    │
 │                      │                     │                    │
 │                      │                     │ Update vote        │
 │                      │                     │ Recalculate score  │
 │                      │                     │ Re-sort queue      │
 │                      │                     │                    │
 │                      │                     │═[queue-updated]══> │
 │                      │<════════════════════╪════════════════════│
 │<──[Queue Reordered]──│                     │                    │
 │    by vote scores    │                     │                    │
```

### 5. Play Next Song Flow

```
Host                 Frontend              Backend              All Users
 │                      │                     │                    │
 │─[Click Next]────────>│                     │                    │
 │                      │                     │                    │
 │                      │─[play-next]────────>│                    │
 │                      │                     │                    │
 │                      │                     │ Move current to    │
 │                      │                     │   history          │
 │                      │                     │ Pop queue[0]       │
 │                      │                     │ Set as current     │
 │                      │                     │                    │
 │                      │                     │═[now-playing]════> │
 │                      │<════════════════════╪════════════════════│
 │<──[Play Song]────────│                     │                    │
 │    Sync to 0:00      │                     │                    │
```

### 6. AI Recommendations Flow

```
User                 Frontend              Backend
 │                      │                     │
 │─[Click AI Button]───>│                     │
 │                      │                     │
 │                      │─[get-recommendations]──>│
 │                      │   {allSongs: [...]}    │
 │                      │                         │
 │                      │                         │ Analyze queue
 │                      │                         │ Extract genres/artists
 │                      │                         │ Score all songs
 │                      │                         │ Filter existing
 │                      │                         │ Sort & return top 10
 │                      │                         │
 │                      │<──[recommendations]──────│
 │                      │    {songs: [...]}       │
 │<─[Display AI Songs]──│                         │
 │    at top of list    │                         │
```

---

## Component Architecture

### Frontend Component Hierarchy

```
App
├── Header
│   ├── SearchBar
│   ├── MoodPlayer Button
│   ├── JamSession Button ◄─── NEW
│   └── Theme Switcher
│
├── [Conditional Render]
│   │
│   ├── JamSession Component ◄─── NEW
│   │   ├── Welcome Screen (not in session)
│   │   │   ├── Create Form
│   │   │   └── Join Form
│   │   │
│   │   └── Session Screen (in session)
│   │       ├── Header
│   │       │   ├── Session Code
│   │       │   ├── Participant Count
│   │       │   └── Leave Button
│   │       │
│   │       ├── Main Content (3-column grid)
│   │       │   ├── Left Sidebar
│   │       │   │   └── Participants List
│   │       │   │
│   │       │   ├── Center Panel
│   │       │   │   ├── Now Playing Card
│   │       │   │   └── Queue List
│   │       │   │       └── Queue Items
│   │       │   │           ├── Song Info
│   │       │   │           ├── Vote Buttons
│   │       │   │           └── Remove Button
│   │       │   │
│   │       │   └── Right Sidebar
│   │       │       ├── Search Input
│   │       │       ├── AI Button
│   │       │       └── Song List
│   │       │           ├── Recommendations
│   │       │           └── All Songs
│   │       │
│   │       └── Notifications
│   │
│   └── Normal View (SongList + Player + Playlists)
│       ├── SongList
│       ├── Player
│       └── PlaylistManager
│
└── MoodPlayer Modal
```

### Backend Module Structure

```
server.js
├── Express Setup
├── Socket.IO Setup ◄─── NEW
├── CORS Configuration
├── Security Middleware
└── Route Handlers
    ├── /api/songs
    ├── /api/playlists
    ├── /api/mood-play
    └── /api/jam ◄─── NEW
        └── jamSession.js
            ├── JamSession Class ◄─── NEW
            │   ├── Session State
            │   ├── Participant Management
            │   ├── Queue Management
            │   ├── Voting System
            │   └── AI Recommender
            │
            ├── REST Endpoints
            │   ├── POST /create
            │   ├── GET /session/:code
            │   └── GET /active-sessions
            │
            └── Socket Handlers
                ├── join-session
                ├── leave-session
                ├── add-to-queue
                ├── vote
                ├── remove-from-queue
                ├── play-next
                ├── playback-update
                └── get-recommendations
```

---

## State Management

### Session State Structure

```javascript
{
  id: "ABC123",                    // 6-char session code
  hostId: "socket-xyz",            // Host socket ID
  hostName: "John",                // Host display name
  
  participants: Map {              // Connected users
    "socket-xyz" => {
      id: "socket-xyz",
      name: "John",
      joinedAt: 1234567890
    },
    "socket-abc" => {
      id: "socket-abc",
      name: "Jane",
      joinedAt: 1234567900
    }
  },
  
  queue: [                         // Song queue
    {
      id: "q-1234-abcd",
      song: {                      // Full song object
        id: 1,
        title: "Song Name",
        artist: "Artist",
        ...
      },
      addedBy: "John",
      userId: "socket-xyz",
      votes: Map {                 // User votes
        "socket-xyz": 1,           // +1 upvote
        "socket-abc": -1           // -1 downvote
      },
      score: 0,                    // Net vote score
      timestamp: 1234567890
    }
  ],
  
  currentSong: {                   // Currently playing
    id: "q-1230-wxyz",
    song: {...},
    addedBy: "Jane",
    userId: "socket-abc"
  },
  
  playbackState: {                 // Sync state
    isPlaying: true,
    currentTime: 42.5,             // seconds
    lastUpdateTime: 1234567890
  },
  
  settings: {
    allowVoting: true,
    maxQueueSize: 50,
    autoPlay: true,
    skipThreshold: 0.5
  },
  
  history: [                       // Recently played
    { song: {...}, playedAt: ... }
  ],
  
  createdAt: 1234567890,
  lastActivity: 1234567900
}
```

---

## Algorithm Details

### Queue Sorting Algorithm

```javascript
function sortQueue(queue) {
  queue.sort((a, b) => {
    // Primary: Vote score (higher is better)
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    
    // Secondary: Timestamp (older is better)
    return a.timestamp - b.timestamp;
  });
}
```

**Example:**
```
Before voting:
1. Song A (score: 0, time: 10:00)
2. Song B (score: 0, time: 10:01)
3. Song C (score: 0, time: 10:02)

After User 1 upvotes Song C:
1. Song C (score: 1, time: 10:02) ← Moved up
2. Song A (score: 0, time: 10:00)
3. Song B (score: 0, time: 10:01)
```

### AI Recommendation Algorithm

```javascript
function getRecommendations(session, allSongs) {
  // 1. Analyze session activity
  const genreFreq = analyzeGenres(session.queue, session.history);
  const artistFreq = analyzeArtists(session.queue, session.history);
  
  // 2. Score each candidate song
  const scored = allSongs
    .filter(notInQueueOrHistory)
    .map(song => ({
      song,
      score: 
        genreFreq[song.genre] * 3 +      // Genre match (3x)
        artistFreq[song.artist] * 2 +    // Artist match (2x)
        Math.random() * 2                // Randomness for diversity
    }));
  
  // 3. Sort and return top 10
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.song);
}
```

**Example:**
```
Session activity:
- Queue: Rock (2), Pop (1)
- Artists: Beatles (2), Queen (1)

Scoring:
- "Hey Jude" by Beatles + Rock
  = 2*3 (genre) + 2*2 (artist) + 1.2 (random)
  = 11.2 points

- "Dancing Queen" by ABBA + Pop  
  = 1*3 (genre) + 0*2 (artist) + 0.8 (random)
  = 3.8 points
```

---

## WebSocket Protocol

### Connection Lifecycle

```
Client                          Server
  │                              │
  │────── connect() ─────────────>│
  │                              │ Store socket
  │<───── connected ──────────────│
  │                              │
  │──── join-session ────────────>│
  │    {code, userName}          │
  │                              │ Add to session
  │                              │ Join room
  │<──── session-joined ──────────│
  │     {session, userId}        │
  │                              │
  │                              │ Broadcast to room
  │<════ participant-joined ══════│
  │                              │
  │                              │
  [User interactions...]
  │                              │
  │                              │
  │──── disconnect ──────────────>│
  │                              │ Remove from session
  │                              │ Broadcast leave
  │                              │ Transfer host if needed
  │                              │ Cleanup if empty
```

### Event Message Format

All events follow this pattern:

```javascript
// Client → Server
socket.emit('event-name', {
  // Required params
  requiredField: value,
  // Optional params
  optionalField: value
});

// Server → Client
socket.emit('event-name', {
  success: boolean,
  data: {...},
  error: "message"  // if success=false
});
```

---

## Security Model

### 1. Session Access Control

```
┌─────────────────────────────────────┐
│  Session Code (ABC123)              │
│  ├─ Generated server-side           │
│  ├─ 6 alphanumeric chars            │
│  └─ 2,176,782,336 combinations      │
└─────────────────────────────────────┘

Anyone with code can join (public)
No passwords or authentication needed
```

### 2. Permission Matrix

```
Action                 │ Any User │ Song Owner │ Host
───────────────────────┼──────────┼────────────┼──────
View session           │    ✓     │     ✓      │  ✓
Add to queue           │    ✓     │     ✓      │  ✓
Vote on songs          │    ✓     │     ✓      │  ✓
Remove own song        │    ✗     │     ✓      │  ✓
Remove any song        │    ✗     │     ✗      │  ✓
Play next              │    ✗     │     ✗      │  ✓
Control playback       │    ✗     │     ✗      │  ✓
```

### 3. Rate Limiting

```javascript
// Backend rate limiter (server.js)
{
  windowMs: 60000,      // 1 minute
  maxRequests: 100      // max requests per window
}
```

### 4. Input Validation

```javascript
// Max lengths
sessionCode: 6 chars
userName: 20 chars
queueSize: 50 songs
jsonPayload: 1KB
```

---

## Performance Characteristics

### Scalability Limits (In-Memory)

```
Single Server Capacity:
├─ Max concurrent sessions: ~1,000
├─ Max users per session: 50 (recommended)
├─ Max songs in queue: 50
├─ Session lifetime: 30 min (inactive)
└─ Cleanup interval: 5 min

Network:
├─ WebSocket connections: ~10K
├─ Avg message size: <1KB
└─ Broadcast latency: <100ms
```

### Production Scaling (with Redis)

```
Distributed Architecture:
├─ Multiple server instances
├─ Redis for session storage
├─ Load balancer (socket affinity)
└─ Can handle 100K+ users
```

---

## Monitoring & Observability

### Key Metrics to Track

```javascript
// Session metrics
- Active sessions count
- Total participants
- Avg session duration
- Session creation rate

// Queue metrics  
- Avg queue length
- Songs added per hour
- Vote activity rate
- Skip rate

// Performance metrics
- WebSocket connection count
- Message rate (in/out)
- Broadcast latency
- Memory usage

// User metrics
- Join/leave rate
- Avg participants per session
- User engagement (votes, adds)
```

### Logging Points

```javascript
// Important events to log
- Session created
- User joined/left
- Host migration
- Session cleanup
- Errors (connection, validation)
- Performance warnings
```

---

## Deployment Considerations

### Environment Variables

```bash
# .env file
PORT=4000
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
SESSION_TIMEOUT=1800000  # 30 min
MAX_QUEUE_SIZE=50
CLEANUP_INTERVAL=300000   # 5 min
```

### Production Checklist

- [ ] Switch to Redis for session storage
- [ ] Enable HTTPS/WSS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring/logging
- [ ] Implement rate limiting per IP
- [ ] Add session authentication (optional)
- [ ] Configure WebSocket ping/pong
- [ ] Set up horizontal scaling
- [ ] Add CDN for static assets
- [ ] Implement graceful shutdown

---

**Last Updated:** December 10, 2025
