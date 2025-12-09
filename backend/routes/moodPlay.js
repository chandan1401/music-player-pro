/**
 * Mood-based song selection endpoint
 * POST /api/mood-play - Returns a song matching the requested mood
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load songs and moods data
const SONGS_FILE = path.join(__dirname, '..', 'songs.json');
const MOODS_FILE = path.join(__dirname, '..', 'data', 'moods.json');

function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`Failed to load ${file}:`, err.message);
    return null;
  }
}

/**
 * POST /api/mood-play
 * Body: { "mood": "happy" }
 * Response: { "song": { id, title, artist, url, cover, genre, duration } }
 */
router.post('/', (req, res) => {
  const { mood } = req.body;
  
  // Validate mood parameter
  if (!mood) {
    return res.status(400).json({ error: 'mood required' });
  }
  
  const validMoods = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'];
  const normalizedMood = mood.toLowerCase().trim();
  
  if (!validMoods.includes(normalizedMood)) {
    return res.status(400).json({ 
      error: 'invalid mood', 
      validMoods,
      received: mood 
    });
  }
  
  // Load songs
  const songsData = loadJson(SONGS_FILE);
  if (!songsData) {
    return res.status(500).json({ error: 'Failed to load songs data' });
  }
  const songs = songsData.songs || songsData;
  
  if (!songs || songs.length === 0) {
    return res.status(404).json({ error: 'No songs available' });
  }
  
  // Load moods mapping
  const moods = loadJson(MOODS_FILE);
  
  let candidates = [];
  
  if (moods) {
    // Find songs that match the requested mood
    candidates = Object.entries(moods)
      .filter(([songId, moodList]) => {
        return Array.isArray(moodList) && moodList.includes(normalizedMood);
      })
      .map(([songId]) => songs.find(s => String(s.id) === songId))
      .filter(Boolean);
  }
  
  // Fallback to random song if no mood matches
  let chosen;
  if (candidates.length > 0) {
    chosen = candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    // Fallback: pick random song
    chosen = songs[Math.floor(Math.random() * songs.length)];
  }
  
  if (!chosen) {
    return res.status(404).json({ error: 'No songs available' });
  }
  
  // Build full URLs for the song
  const baseUrl = `http://localhost:${process.env.PORT || 4000}/media`;
  
  const response = {
    song: {
      id: chosen.id,
      title: chosen.title,
      artist: chosen.artist,
      url: `${baseUrl}/${chosen.path}`,
      cover: chosen.cover ? `${baseUrl}/${chosen.cover}` : null,
      genre: chosen.genre || null,
      duration: chosen.duration || null
    },
    requestedMood: normalizedMood,
    totalCandidates: candidates.length
  };
  
  return res.json(response);
});

module.exports = router;
