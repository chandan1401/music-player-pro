// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS - Allow all origins for local network access
app.use(cors({
  origin: true,  // Allow all origins
  methods: ['GET', 'POST'],
  credentials: false,
  maxAge: 600,
  optionsSuccessStatus: 204
}));

// Socket.IO setup for real-time jam sessions
const io = new Server(server, {
  cors: {
    origin: "*",  // Allow all origins
    methods: ['GET', 'POST']
  }
});

// Log server's network address
console.log('Network IP: 192.168.1.11');

// Security headers - disabled CSP to allow audio playback
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '1kb' }));  // Limit payload size

// Rate limiting middleware
const requestCounts = new Map();
app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const timestamps = requestCounts.get(ip).filter(t => now - t < windowMs);
  
  if (timestamps.length >= maxRequests) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  timestamps.push(now);
  requestCounts.set(ip, timestamps);
  next();
});

// static files: song mp3 and images
app.use('/media', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  }
}));

const SONGS_FILE = path.join(__dirname, 'songs.json');
const PLAYLISTS_FILE = path.join(__dirname, 'playlists.json', 'playlists.json');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to read ${path.basename(file)}: ${err.message}`);
  }
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// GET all songs
app.get('/api/songs', (req, res, next) => {
  try {
    const data = readJson(SONGS_FILE);
    res.json(data.songs || data);
  } catch (err) {
    next(err);
  }
});

// GET playlists
app.get('/api/playlists', (req, res, next) => {
  try {
    const raw = fs.existsSync(PLAYLISTS_FILE) ? readJson(PLAYLISTS_FILE) : [];
    const lists = raw.playlists || raw || [];
    const normalized = lists.map(l => ({
      ...l,
      songIds: l.songIds ?? l.songs ?? []
    }));
    res.json(normalized);
  } catch (err) {
    next(err);
  }
});

// Mood-based song selection endpoint (allows POST)
const moodPlayRouter = require('./routes/moodPlay');
app.use('/api/mood-play', moodPlayRouter);

// Jam session endpoints (allows POST for session creation)
const { router: jamSessionRouter, setupSocketHandlers } = require('./routes/jamSession');
app.use('/api/jam', jamSessionRouter);

// Lyrics proxy endpoint (avoids CORS issues)
const lyricsRouter = require('./routes/lyrics');
app.use('/api/lyrics', lyricsRouter);

// Setup Socket.IO handlers for real-time communication
setupSocketHandlers(io);

// SECURITY: ALL OTHER WRITE OPERATIONS DISABLED
// Reject any POST, PUT, PATCH, DELETE requests (except mood-play which is handled above)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Write operations are disabled. This API is read-only.' 
    });
  }
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.1.11:${PORT}`);
  console.log(`WebSocket server ready for jam sessions`);
});
