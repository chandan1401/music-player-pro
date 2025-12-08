// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

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

// POST create playlist
app.post('/api/playlists', (req, res, next) => {
  try {
    const { name, songIds = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const raw = fs.existsSync(PLAYLISTS_FILE) ? readJson(PLAYLISTS_FILE) : [];
    const lists = (raw.playlists || raw || []).map(l => ({
      ...l,
      songIds: l.songIds ?? l.songs ?? []
    }));
    const newList = { id: Date.now(), name, songIds };
    lists.push(newList);
    const out = { playlists: lists };
    writeJson(PLAYLISTS_FILE, out);
    res.status(201).json(newList);
  } catch (err) {
    next(err);
  }
});

// PUT add/remove song in playlist
app.put('/api/playlists/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { songIds } = req.body;
    const raw = fs.existsSync(PLAYLISTS_FILE) ? readJson(PLAYLISTS_FILE) : [];
    const lists = (raw.playlists || raw || []).map(l => ({
      ...l,
      songIds: l.songIds ?? l.songs ?? []
    }));
    const idx = lists.findIndex(l => l.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    lists[idx].songIds = songIds;
    const out = { playlists: lists };
    writeJson(PLAYLISTS_FILE, out);
    res.json(lists[idx]);
  } catch (err) {
    next(err);
  }
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
