// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// STRICT CORS - Only allow specific origin, read-only access
const ALLOWED_ORIGINS = ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (direct browser requests for media)
    // or from allowed origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Access denied'));
    }
  },
  methods: ['GET'],  // ONLY allow GET requests - no modifications
  credentials: false,  // No credentials allowed
  maxAge: 600,  // Cache preflight for 10 minutes
  optionsSuccessStatus: 204
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc: ["'self'", 'http://localhost:3000']
    }
  }
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

// SECURITY: ALL WRITE OPERATIONS DISABLED
// Reject any POST, PUT, PATCH, DELETE requests
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
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
