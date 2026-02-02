import React, { useEffect, useState } from 'react';
import SongList from './Components/Songlist';
import Player from './Components/player';
import PlaylistManager from './Components/Playlistmanager';
import SearchBar from './Components/SearchBar';
import MoodPlayer from './Components/MoodPlayer';
import JamSession from './Components/JamSession';
import AnalyticsDashboard from './Components/AnalyticsDashboard';
import { API_BASE_URL } from './config';

const deriveMood = (song = {}) => {
  const normalizedPlaylist = (song.playlist || '').toLowerCase();
  const normalizedGenre = (song.genre || '').toLowerCase();
  if (song.mood) return song.mood;
  if (normalizedPlaylist.includes('happy') || normalizedGenre.includes('pop')) return 'happy';
  if (normalizedPlaylist.includes('sad') || normalizedGenre.includes('sad')) return 'sad';
  if (normalizedPlaylist.includes('angry')) return 'angry';
  return 'neutral';
};

export default function App() {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [filter, setFilter] = useState('');
  const [theme, setTheme] = useState('dark');
  const [sortBy, setSortBy] = useState('title');
  const [filterGenre, setFilterGenre] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({ totalPlayed: 0, totalTime: 0 });
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [showMoodPlayer, setShowMoodPlayer] = useState(false);
  const [showJamSession, setShowJamSession] = useState(false);
  const [queueOrder, setQueueOrder] = useState([]);
  const [playCounts, setPlayCounts] = useState({});
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [currentMood, setCurrentMood] = useState('neutral');
  const [listeningEvents, setListeningEvents] = useState([]);
  const [skipCounts, setSkipCounts] = useState({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/songs`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const payload = Array.isArray(data) ? data : (Array.isArray(data?.songs) ? data.songs : []);
        if (payload.length === 0) {
          console.warn('No songs received from API');
          return;
        }
        setSongs(payload);
        setQueueOrder(prev => {
          const saved = prev && prev.length ? prev : [];
          const sanitized = saved.filter(id => payload.some(s => s.id === id));
          const missing = payload.map(s => s.id).filter(id => !sanitized.includes(id));
          return [...sanitized, ...missing];
        });
      })
      .catch(err => console.error('Failed to fetch songs:', err));
    
    // Load favorites from localStorage
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(JSON.parse(saved));
    
    const savedStats = localStorage.getItem('stats');
    if (savedStats) setStats(JSON.parse(savedStats));

    const savedQueue = localStorage.getItem('queueOrder');
    if (savedQueue) setQueueOrder(JSON.parse(savedQueue));

    const savedCounts = localStorage.getItem('playCounts');
    if (savedCounts) setPlayCounts(JSON.parse(savedCounts));

    const savedRecent = localStorage.getItem('recentlyPlayed');
    if (savedRecent) setRecentlyPlayed(JSON.parse(savedRecent));

    const savedEvents = localStorage.getItem('listeningEvents');
    if (savedEvents) setListeningEvents(JSON.parse(savedEvents));

    const savedSkipCounts = localStorage.getItem('skipCounts');
    if (savedSkipCounts) setSkipCounts(JSON.parse(savedSkipCounts));
  }, []);

  // Load saved theme (if any)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Persist favorites and stats to localStorage
  useEffect(() => {
    try { localStorage.setItem('favorites', JSON.stringify(favorites)); } catch (e) {}
  }, [favorites]);

  useEffect(() => {
    try { localStorage.setItem('stats', JSON.stringify(stats)); } catch (e) {}
  }, [stats]);

  useEffect(() => {
    try { localStorage.setItem('queueOrder', JSON.stringify(queueOrder)); } catch (e) {}
  }, [queueOrder]);

  useEffect(() => {
    try { localStorage.setItem('playCounts', JSON.stringify(playCounts)); } catch (e) {}
  }, [playCounts]);

  useEffect(() => {
    try { localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed)); } catch (e) {}
  }, [recentlyPlayed]);

  useEffect(() => {
    try { localStorage.setItem('listeningEvents', JSON.stringify(listeningEvents)); } catch (e) {}
  }, [listeningEvents]);

  useEffect(() => {
    try { localStorage.setItem('skipCounts', JSON.stringify(skipCounts)); } catch (e) {}
  }, [skipCounts]);

  // keep queue in sync when songs list changes
  useEffect(() => {
    if (!songs.length) return;
    setQueueOrder(prev => {
      const sanitized = (prev || []).filter(id => songs.some(s => s.id === id));
      const missing = songs.map(s => s.id).filter(id => !sanitized.includes(id));
      return sanitized.length || missing.length ? [...sanitized, ...missing] : songs.map(s => s.id);
    });
  }, [songs]);

  const playSongAt = (index, isFromFiltered = true) => {
    // If clicking from filtered list, find actual index in full songs array
    if (isFromFiltered) {
      const filteredSongs = getFilteredSongs();
      const actualSong = filteredSongs[index];
      const actualIndex = songs.findIndex(s => s.id === actualSong.id);
      setCurrentIndex(actualIndex);
      setPlaying(true);
      updateStats(actualIndex);
    } else {
      setCurrentIndex(index);
      setPlaying(true);
      updateStats(index);
    }
  };

  const changeTheme = (themeName) => {
    setTheme(themeName);
    localStorage.setItem('theme', themeName);
  };

  const toggleFavorite = (songId) => {
    setFavorites(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const updateStats = (index) => {
    const song = songs[index];
    if (!song || !song.id) return;
    const dur = song.duration || 0;
    const songId = song.id;
    const mood = deriveMood(song);

    setCurrentMood(mood);

    setStats(prev => ({
      totalPlayed: (prev.totalPlayed || 0) + 1,
      totalTime: (prev.totalTime || 0) + dur
    }));

    setPlayCounts(prev => ({
      ...prev,
      [songId]: (prev[songId] || 0) + 1
    }));

    setRecentlyPlayed(prev => {
      const filtered = prev.filter(item => item.id !== songId);
      return [{ id: songId, ts: Date.now() }, ...filtered].slice(0, 10);
    });

    setListeningEvents(prev => {
      const next = [{ id: songId, ts: Date.now(), mood }, ...prev];
      return next.slice(0, 200);
    });
  };

  const recordSkip = (songId) => {
    if (!songId) return;
    setSkipCounts(prev => ({
      ...prev,
      [songId]: (prev[songId] || 0) + 1
    }));
  };

  const getFilteredSongs = () => {
    const q = (filter || '').toLowerCase();
    let filtered = songs.filter(s => {
      const title = (s.title || '').toLowerCase();
      const artist = (s.artist || '').toLowerCase();
      const matchesQuery = !q || title.includes(q) || artist.includes(q);
      const matchesGenre = filterGenre === 'all' || s.genre === filterGenre;
      const matchesPlaylist = !activePlaylist || (activePlaylist.songIds && activePlaylist.songIds.includes(s.id));
      return matchesQuery && matchesGenre && matchesPlaylist;
    });

    switch(sortBy) {
      case 'title':
        return [...filtered].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'artist':
        return [...filtered].sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
      case 'duration':
        return [...filtered].sort((a, b) => (a.duration || 0) - (b.duration || 0));
      case 'favorites':
        return [...filtered].sort((a, b) => {
          const aFav = favorites.includes(a.id) ? 1 : 0;
          const bFav = favorites.includes(b.id) ? 1 : 0;
          return bFav - aFav;
        });
      default:
        return filtered;
    }
  };

  const genres = ['all', ...new Set(songs.map(s => s.genre).filter(Boolean))];

  const currentSongId = currentIndex !== null ? songs[currentIndex]?.id : null;

  useEffect(() => {
    if (currentSongId == null) {
      setCurrentMood('neutral');
      return;
    }
    const song = songs.find(s => s.id === currentSongId);
    if (!song) return;
    setCurrentMood(deriveMood(song));
  }, [currentSongId, songs]);

  const moodGradients = {
    happy: 'linear-gradient(135deg, rgba(255,196,112,0.35), rgba(255,129,104,0.35)), var(--gradient)',
    sad: 'linear-gradient(135deg, rgba(99,149,255,0.35), rgba(83,116,255,0.4)), var(--gradient)',
    angry: 'linear-gradient(135deg, rgba(255,99,99,0.35), rgba(255,76,0,0.3)), var(--gradient)',
    neutral: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03)), var(--gradient)'
  };

  const mostPlayed = Object.entries(playCounts)
    .map(([id, count]) => ({ id: Number(id), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(entry => ({ ...entry, song: songs.find(s => s.id === entry.id) }))
    .filter(entry => entry.song);

  const recentSongs = recentlyPlayed
    .map(item => songs.find(s => s.id === item.id))
    .filter(Boolean);

  // Handle mood-based song selection from MoodPlayer
  const handleMoodSongSelect = (song) => {
    // Find the song in our songs array by matching title/artist or id
    const matchedIndex = songs.findIndex(s => 
      s.id === song.id || 
      (s.title === song.title && s.artist === song.artist)
    );
    
    if (matchedIndex >= 0) {
      setCurrentIndex(matchedIndex);
      setPlaying(true);
      updateStats(matchedIndex);
    }
    setShowMoodPlayer(false);
  };

  return (
    <div 
      className={`app ${theme === 'dark' ? '' : theme + '-theme'}`}
      style={{ backgroundImage: moodGradients[currentMood] }}
    >
      <header>
        <div className="header-inner">
          {activePlaylist && (
            <button 
              className="back-btn"
              onClick={() => setActivePlaylist(null)}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              title="Back to all songs"
            >
              ←
            </button>
          )}
          <div className="brand">
            <div className="brand-mark animated-logo">
              <img src="/Rose Gold Black Elegant Luxury Circle Beauty Logo_edited.png" alt="RaagDhara logo" />
            </div>
            <div className="brand-copy">
              <h1>RaagDhara</h1>
              <p className="subhead">{activePlaylist ? `${activePlaylist.name} Playlist` : 'Indian Music Tradition'}</p>
            </div>
          </div>
          <div className="header-content">
            <SearchBar onChange={setFilter}/>
            <button 
              className="mood-btn"
              onClick={() => setShowMoodPlayer(true)}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title="Play music based on your mood using AI emotion detection"
            >
              🎭 Music from Mood
            </button>
            <button
              className="jam-btn"
              onClick={() => {
                // Pause main player audio before opening Jam Session to avoid overlapping playback
                if (!showJamSession) {
                  setPlaying(false);
                }
                setShowJamSession(!showJamSession);
              }}
              style={{
                background: showJamSession 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                marginLeft: '10px'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title="Create or join a collaborative jam session with friends"
            >
              {showJamSession ? '🎵 Back to Player' : '🎸 Jam Session'}
            </button>
          </div>
        </div>
      </header>

      {!showJamSession && (
        <div className="controls-bar">
          <div className="controls-inner">
            <div className="sort-controls">
              <label>Sort</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="title">Title</option>
                <option value="artist">Artist</option>
                <option value="duration">Duration</option>
                <option value="favorites">Favorites</option>
              </select>
            </div>
            
            <div className="genre-filter">
              <label>Genre</label>
              <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="stats">
              <span>🎵 Played: {stats.totalPlayed} • ⏳ {Math.floor(stats.totalTime / 60)}m</span>
            </div>
          </div>
        </div>
      )}

      {showJamSession ? (
        <JamSession 
          songs={songs} 
          onPlaySong={(song) => {
            const index = songs.findIndex(s => s.id === song.id);
            if (index !== -1) {
              playSongAt(index, false);
            }
          }}
          onBack={() => setShowJamSession(false)}
        />
      ) : (
        <main className="content-grid">
          <SongList
            songs={getFilteredSongs()}
            onPlay={playSongAt}
            currentSongId={currentSongId}
            favorites={favorites}
            onFavorite={toggleFavorite}
          />

          <aside>
            <PlaylistManager 
              songs={songs} 
              onPlay={playSongAt}
              activePlaylist={activePlaylist}
              onSelectPlaylist={setActivePlaylist}
            />
            <div className="favorites-widget">
              <h3>❤️ Favorites</h3>
              <div className="favorites-list">
                {songs.filter(s => favorites.includes(s.id)).map((song, idx) => (
                  <div key={song.id} className="fav-song">
                    <span>{song.title}</span>
                    <button onClick={() => playSongAt(songs.indexOf(song), false)}>▶</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="history-widget">
              <h3>🕒 Recently Played</h3>
              <div className="history-list">
                {recentSongs.length === 0 && <span className="muted">No plays yet</span>}
                {recentSongs.map(song => (
                  <div key={song.id} className="history-item">
                    <div className="history-title">{song.title}</div>
                    <button onClick={() => playSongAt(songs.indexOf(song), false)}>▶</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="history-widget">
              <h3>📈 Most Played</h3>
              <div className="history-list">
                {mostPlayed.length === 0 && <span className="muted">No data yet</span>}
                {mostPlayed.map(entry => (
                  <div key={entry.id} className="history-item">
                    <div className="history-title">{entry.song.title}</div>
                    <span className="history-count">{entry.count} plays</span>
                    <button onClick={() => playSongAt(songs.indexOf(entry.song), false)}>▶</button>
                  </div>
                ))}
              </div>
            </div>

            <AnalyticsDashboard
              songs={songs}
              listeningEvents={listeningEvents}
              skipCounts={skipCounts}
              playCounts={playCounts}
              currentMood={currentMood}
              onPlaySong={(id) => {
                const idx = songs.findIndex(s => s.id === id);
                if (idx !== -1) playSongAt(idx, false);
              }}
            />
          </aside>
        </main>
      )}

      {/* Only show main player when NOT in Jam Session */}
      {!showJamSession && (
        <Player
          songs={songs}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          queueOrder={queueOrder}
          setQueueOrder={setQueueOrder}
          currentSongId={currentSongId}
          playing={playing}
          setPlaying={setPlaying}
          onFavorite={toggleFavorite}
          isFavorite={currentIndex !== null && favorites.includes(songs[currentIndex]?.id)}
          onSkip={recordSkip}
        />
      )}

      {/* Mood-based music player modal */}
      {showMoodPlayer && (
        <MoodPlayer 
          onSongSelect={handleMoodSongSelect}
          onClose={() => setShowMoodPlayer(false)}
        />
      )}
    </div>
  );
}
