import React, { useEffect, useState } from 'react';
import SongList from './Components/Songlist';
import Player from './Components/player';
import PlaylistManager from './Components/Playlistmanager';
import SearchBar from './Components/SearchBar';

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

  useEffect(() => {
    fetch('http://localhost:4000/api/songs')
      .then(res => res.json())
      .then(data => setSongs(data.songs || data))
      .catch(err => console.error(err));
    
    // Load favorites from localStorage
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(JSON.parse(saved));
    
    const savedStats = localStorage.getItem('stats');
    if (savedStats) setStats(JSON.parse(savedStats));
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
    const dur = songs[index]?.duration || 0;
    setStats(prev => ({
      totalPlayed: (prev.totalPlayed || 0) + 1,
      totalTime: (prev.totalTime || 0) + dur
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

  return (
    <div className={`app ${theme === 'dark' ? '' : theme + '-theme'}`}>
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
            <div className="brand-mark">
              <img src="/logo.svg" alt="Music Player logo" />
            </div>
            <div className="brand-copy">
              <h1>Music Player Pro</h1>
              <p className="subhead">{activePlaylist ? `${activePlaylist.name} Playlist` : 'Polished, pitch-ready listening experience.'}</p>
            </div>
          </div>
          <div className="header-content">
            <SearchBar onChange={setFilter}/>
            <div className="theme-switcher">
              {['dark', 'ocean', 'purple', 'red', 'cyberpunk'].map(t => (
                <button 
                  key={t}
                  className={`theme-btn ${theme === t ? 'active' : ''}`}
                  onClick={() => changeTheme(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

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
            <span>📊 Played: {stats.totalPlayed} • ⏱️ {Math.floor(stats.totalTime / 60)}m</span>
          </div>
        </div>
      </div>

      <main className="content-grid">
        <SongList
          songs={getFilteredSongs()}
          onPlay={playSongAt}
          currentIndex={currentIndex}
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
        </aside>
      </main>

      <Player
        songs={songs}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        playing={playing}
        setPlaying={setPlaying}
        onFavorite={toggleFavorite}
        isFavorite={currentIndex !== null && favorites.includes(songs[currentIndex]?.id)}
      />
    </div>
  );
}
