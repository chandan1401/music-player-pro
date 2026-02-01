/**
 * Lyrics proxy endpoint
 * GET /api/lyrics/:artist/:title - Proxy lyrics requests to avoid CORS issues
 */
const express = require('express');
const router = express.Router();
const https = require('https');

/**
 * GET /api/lyrics/:artist/:title
 * Proxies lyrics requests to external API to avoid CORS issues
 */
router.get('/:artist/:title', async (req, res) => {
  const { artist, title } = req.params;
  
  if (!artist || !title) {
    return res.status(400).json({ error: 'Artist and title are required' });
  }

  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
  
  https.get(url, (apiRes) => {
    let data = '';
    
    apiRes.on('data', (chunk) => {
      data += chunk;
    });
    
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        res.json(parsed);
      } catch (err) {
        res.status(500).json({ error: 'Failed to parse lyrics response' });
      }
    });
  }).on('error', (err) => {
    console.error('Lyrics API error:', err);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  });
});

module.exports = router;
