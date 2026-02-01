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
const MOOD_PLAYLISTS_FILE = path.join(__dirname, '..', 'data', 'moodPlaylists.json');

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
  
  // Load mood playlists (preferred method)
  const moodPlaylists = loadJson(MOOD_PLAYLISTS_FILE);
  
  let candidates = [];
  let playlistUsed = null;
  
  if (moodPlaylists && moodPlaylists[normalizedMood]) {
    // Use the mood playlist
    const playlist = moodPlaylists[normalizedMood];
    playlistUsed = playlist.name;
    
    candidates = playlist.songIds
      .map(songId => songs.find(s => s.id === songId))
      .filter(Boolean);
    
    console.log(`Mood: ${normalizedMood}, Playlist: ${playlistUsed}, Songs: ${candidates.length}`);
  } else {
    // Fallback to old moods mapping
    const moods = loadJson(MOODS_FILE);
    
    if (moods) {
      candidates = Object.entries(moods)
        .filter(([songId, moodList]) => {
          return Array.isArray(moodList) && moodList.includes(normalizedMood);
        })
        .map(([songId]) => songs.find(s => String(s.id) === songId))
        .filter(Boolean);
    }
  }
  
  // If no songs mapped to this mood, return an empty result instead of a random fallback
  if (candidates.length === 0) {
    return res.status(404).json({ 
      error: 'No songs available for this mood',
      requestedMood: normalizedMood
    });
  }

  // Pick one song from the mood-specific candidates
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  
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
      duration: chosen.duration || null,
      path: chosen.path
    },
    requestedMood: normalizedMood,
    totalCandidates: candidates.length,
    playlistUsed: playlistUsed || 'fallback'
  };
  
  return res.json(response);
});

/**
 * GET /api/mood-play/playlists
 * Returns all available mood playlists
 */
router.get('/playlists', (req, res) => {
  const moodPlaylists = loadJson(MOOD_PLAYLISTS_FILE);
  
  if (!moodPlaylists) {
    return res.status(500).json({ error: 'Failed to load mood playlists' });
  }
  
  const songsData = loadJson(SONGS_FILE);
  const songs = songsData?.songs || songsData || [];
  
  // Enrich playlists with song details
  const enrichedPlaylists = {};
  
  Object.entries(moodPlaylists).forEach(([mood, playlist]) => {
    enrichedPlaylists[mood] = {
      ...playlist,
      songs: playlist.songIds
        .map(songId => songs.find(s => s.id === songId))
        .filter(Boolean)
        .map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          genre: song.genre
        }))
    };
  });
  
  return res.json({ playlists: enrichedPlaylists });
});

module.exports = router;
