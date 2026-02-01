# Jam Session Feature - Implementation Guide

## Overview
A real-time collaborative music session feature (similar to Spotify's Jam) where multiple users can join a shared session, add songs to a common queue, vote on songs, and sync playback in real-time.

## Tech Stack
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: React + Socket.IO Client
- **Real-time Communication**: WebSocket (Socket.IO)

---

## Features Implemented

### 1. **Session Management**
- ✅ Create new jam sessions with unique 6-character codes
- ✅ Join existing sessions using session codes
- ✅ Automatic session cleanup after 30 minutes of inactivity
- ✅ Host assignment (first user becomes host)
- ✅ Automatic host migration when host leaves

### 2. **Real-time Collaboration**
- ✅ Live participant list with join/leave notifications
- ✅ Synchronized queue updates across all participants
- ✅ Real-time song additions and removals
- ✅ Synchronized playback state (controlled by host)

### 3. **Voting System**
- ✅ Upvote/downvote songs in the queue
- ✅ Automatic queue reordering based on votes
- ✅ Visual indication of user's votes
- ✅ Vote score display for each song

### 4. **Queue Management**
- ✅ Add songs to shared queue
- ✅ Remove songs (by song owner or host)
- ✅ Play next song (host control)
- ✅ Maximum queue size limit (50 songs)
- ✅ Recently played history

### 5. **AI-Powered Recommendations**
- ✅ Smart song suggestions based on session activity
- ✅ Genre and artist preference analysis
- ✅ Excludes songs already in queue or history
- ✅ Weighted scoring with diversity randomness

---

## Installation

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **The following dependency was added to `package.json`:**
```json
"socket.io": "^4.6.1"
```

3. **Start the backend server:**
```bash
npm start
```

Server runs on `http://localhost:4000` with WebSocket support.

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **The following dependency was added to `package.json`:**
```json
"socket.io-client": "^4.6.1"
```

3. **Start the frontend:**
```bash
npm run dev
```

Frontend runs on `http://localhost:5001` or `http://localhost:3000` (depending on your Vite config).

---

## Architecture

### Backend Architecture

#### **1. Session Storage**
```javascript
sessions = Map<sessionCode, JamSession>
```

Each `JamSession` contains:
- `id`: Unique session code (6 chars)
- `hostId`: Socket ID of the host
- `participants`: Map of connected users
- `queue`: Array of songs with votes
- `currentSong`: Currently playing song
- `playbackState`: Sync state (isPlaying, currentTime)
- `settings`: Session configuration
- `history`: Recently played songs

#### **2. Socket.IO Events**

**Client → Server:**
- `join-session`: Join a session
- `leave-session`: Leave current session
- `add-to-queue`: Add song to queue
- `vote`: Vote on a queue item
- `remove-from-queue`: Remove song from queue
- `play-next`: Play next song in queue
- `playback-update`: Sync playback state
- `get-recommendations`: Request AI suggestions

**Server → Client:**
- `session-joined`: Confirmation with session state
- `participant-joined`: New user joined
- `participant-left`: User left session
- `queue-updated`: Queue changed
- `now-playing`: New song started
- `playback-sync`: Playback state update
- `recommendations`: AI song suggestions
- `error`: Error occurred

#### **3. REST API Endpoints**

```
POST /api/jam/create
  Body: { hostName: string }
  Returns: { sessionCode, hostId, session }

GET /api/jam/session/:code
  Returns: { session }

GET /api/jam/active-sessions
  Returns: { sessions: [...] }
```

---

### Frontend Architecture

#### **Component Structure**

```
JamSession Component
├── Session Creation/Join Forms
├── Session Header (code, participants, leave button)
├── Main Content (3-column layout)
│   ├── Left Sidebar: Participants List
│   ├── Center Panel: Now Playing + Queue
│   └── Right Sidebar: Add Songs + AI Recommendations
└── Notifications
```

#### **State Management**

```javascript
- socket: Socket.IO connection
- isInSession: Boolean
- sessionCode: String
- userId: User ID
- session: Full session state
- queue: Array of queue items
- currentSong: Currently playing
- participants: Array of users
- recommendations: AI suggestions
```

---

## Usage Guide

### For Users

#### **Creating a Session:**
1. Click "🎸 Jam Session" button in the header
2. Click "🎸 Create New Session"
3. Enter your name
4. Share the 6-character session code with friends

#### **Joining a Session:**
1. Click "🎸 Jam Session" button
2. Click "🎤 Join Existing Session"
3. Enter session code and your name
4. Click "Join Session"

#### **Adding Songs:**
1. Search for songs in the right sidebar
2. Click the "+" button to add to queue
3. Or click "🤖 AI Suggestions" for recommendations

#### **Voting:**
- Click 👍 to upvote a song (moves it up in queue)
- Click 👎 to downvote a song (moves it down)
- Click again to remove your vote

#### **Queue Management:**
- Host can start playback with "▶️ Start" button
- Host can skip to next song with "⏭️ Next Song"
- Users can remove their own songs
- Host can remove any song

---

## Key Features Explained

### 1. **Voting Algorithm**
```javascript
Queue Sort Priority:
1. Vote score (descending)
2. Timestamp (ascending - older songs first)
```

Each user can vote once per song (+1, -1, or 0). The queue automatically reorders when votes change.

### 2. **AI Recommendations**
The recommendation engine analyzes:
- **Genres** in queue and history (3x weight)
- **Artists** in queue and history (2x weight)
- **Randomness** for diversity (1-2 points)

Returns top 10 songs not already in queue or history.

### 3. **Host Controls**
The host has special privileges:
- Start/stop playback
- Play next song
- Remove any song from queue
- Host role auto-transfers if host leaves

### 4. **Playback Sync**
The host's player controls the session. When the host:
- Plays/pauses → All users sync
- Seeks position → All users sync
- Plays next → Queue advances for everyone

### 5. **Session Cleanup**
- Inactive sessions (30+ min) auto-deleted
- Empty sessions deleted after 1 minute
- Cleanup runs every 5 minutes

---

## API Reference

### REST Endpoints

#### Create Session
```http
POST /api/jam/create
Content-Type: application/json

{
  "hostName": "John"
}

Response:
{
  "success": true,
  "sessionCode": "ABC123",
  "hostId": "host-1234567890",
  "session": { ... }
}
```

#### Get Session
```http
GET /api/jam/session/ABC123

Response:
{
  "success": true,
  "session": {
    "id": "ABC123",
    "hostId": "...",
    "participants": [...],
    "queue": [...],
    "currentSong": {...},
    ...
  }
}
```

#### List Active Sessions
```http
GET /api/jam/active-sessions

Response:
{
  "success": true,
  "sessions": [
    {
      "code": "ABC123",
      "hostName": "John",
      "participantCount": 3,
      "queueSize": 5,
      "createdAt": 1234567890
    }
  ]
}
```

---

## Socket Events Reference

### Client Events

```javascript
// Join session
socket.emit('join-session', {
  sessionCode: 'ABC123',
  userName: 'John',
  userId: 'optional-user-id'
});

// Add song to queue
socket.emit('add-to-queue', {
  song: {
    id: 1,
    title: 'Song Name',
    artist: 'Artist Name',
    // ... other song properties
  }
});

// Vote on song
socket.emit('vote', {
  queueItemId: 'queue-item-id',
  voteValue: 1  // 1 = upvote, -1 = downvote, 0 = remove vote
});

// Remove from queue
socket.emit('remove-from-queue', {
  queueItemId: 'queue-item-id'
});

// Play next song
socket.emit('play-next');

// Get recommendations
socket.emit('get-recommendations', {
  allSongs: [...]  // Full song library
});
```

### Server Events

```javascript
// Session joined successfully
socket.on('session-joined', (data) => {
  console.log(data.session, data.userId);
});

// Queue updated
socket.on('queue-updated', (data) => {
  console.log(data.queue);
});

// Now playing
socket.on('now-playing', (data) => {
  console.log(data.song);
});

// AI recommendations
socket.on('recommendations', (data) => {
  console.log(data.songs);
});

// Error
socket.on('error', (data) => {
  console.error(data.message);
});
```

---

## Security Considerations

1. **Session Codes**: 6-character alphanumeric codes provide 2.1 billion combinations
2. **Rate Limiting**: Built-in rate limiting on backend
3. **CORS**: Restricted to allowed origins only
4. **Input Validation**: Server validates all inputs
5. **Queue Limits**: Maximum 50 songs per session
6. **Payload Limits**: JSON payloads limited to 1KB

---

## Performance Optimizations

1. **In-Memory Storage**: Fast session access (consider Redis for production)
2. **Automatic Cleanup**: Prevents memory leaks
3. **Efficient Sorting**: Queue sorts only on vote changes
4. **Selective Broadcasting**: Events sent only to session participants
5. **Debounced Updates**: Playback sync throttled to prevent spam

---

## Future Enhancements

- [ ] Persistent storage (Redis/Database)
- [ ] User authentication and profiles
- [ ] Session privacy settings (public/private)
- [ ] Chat functionality
- [ ] Song shuffle mode
- [ ] Playlist import
- [ ] Mobile app support
- [ ] Advanced voting modes (skip voting)
- [ ] Session analytics
- [ ] Custom session themes

---

## Troubleshooting

### Connection Issues
- Verify backend is running on port 4000
- Check CORS settings match frontend URL
- Ensure WebSocket port is not blocked

### Session Not Found
- Session codes are case-insensitive
- Sessions expire after 30 minutes of inactivity
- Verify the session hasn't been cleaned up

### Voting Not Working
- Only session participants can vote
- Can't vote on removed songs
- Check voting is enabled in session settings

### Playback Not Syncing
- Only host controls playback
- Ensure host player is functioning
- Check network connectivity

---

## Testing

### Manual Testing Checklist

- [ ] Create session and verify code generation
- [ ] Join session from second browser/device
- [ ] Add songs to queue from multiple users
- [ ] Vote on songs and verify reordering
- [ ] Remove songs (owner and host)
- [ ] Play next song as host
- [ ] Leave session and verify participant list updates
- [ ] Test host migration when host leaves
- [ ] Request AI recommendations
- [ ] Test session cleanup after inactivity

### Load Testing Considerations

- Max recommended users per session: 50
- Max queue size: 50 songs
- Session timeout: 30 minutes
- Cleanup interval: 5 minutes

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all dependencies are installed
3. Check browser console for errors
4. Verify backend logs for server-side issues

---

**Built with ❤️ for collaborative music listening**
