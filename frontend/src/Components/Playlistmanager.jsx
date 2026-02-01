import React, { useEffect, useState } from 'react';

export default function PlaylistManager({ songs, onPlay, activePlaylist, onSelectPlaylist }) {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    // Create automatic playlists based on song metadata
    const autoPlaylists = [];
    
    // Group songs by playlist field
    const playlistGroups = {};
    songs.forEach(song => {
      if (song.playlist) {
        if (!playlistGroups[song.playlist]) {
          playlistGroups[song.playlist] = [];
        }
        playlistGroups[song.playlist].push(song.id);
      }
    });
    
    // Create playlist objects
    Object.keys(playlistGroups).forEach((playlistName, idx) => {
      autoPlaylists.push({
        id: `auto-${idx}`,
        name: playlistName,
        songIds: playlistGroups[playlistName],
        isAuto: true
      });
    });
    
    // Fetch user-created playlists and merge
    fetch(`/api/playlists`)
      .then(r => r.json())
      .then(data => {
        const payload = Array.isArray(data) ? data : data.playlists || [];
        const normalized = payload.map(l => ({
          ...l,
          songIds: l.songIds ?? l.songs ?? [],
          isAuto: false
        }));
        setLists([...autoPlaylists, ...normalized]);
      })
      .catch(() => setLists(autoPlaylists));
  }, [songs]);

  return (
    <div className="playlists">
      <h3>Playlists</h3>

      {lists.map(l => {
        const playlistSongs = songs.filter(s => (l.songIds || []).includes(s.id));
        const coverImage = playlistSongs.length > 0 
          ? `/media/${playlistSongs[0].cover}` 
          : null;
        
        return (
          <div 
            key={l.id} 
            className={`playlist-card ${activePlaylist?.id === l.id ? 'active' : ''}`}
            onClick={() => onSelectPlaylist(activePlaylist?.id === l.id ? null : l)}
          >
            {coverImage && (
              <div className="playlist-card-cover">
                <img src={coverImage} alt={l.name} />
              </div>
            )}
            <div className="playlist-card-info">
              <div>
                <div style={{fontWeight: 'bold', marginBottom: '4px'}}>{l.name}</div>
                <span style={{fontSize: '0.8em', opacity: 0.7}}>{(l.songIds || []).length} songs</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const ids = l.songIds ?? l.songs ?? [];
                  if (!ids.length) return;
                  const idx = songs.findIndex(s => s.id === ids[0]);
                  if (idx !== -1) onPlay(idx, false);
                }}
              >▶</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
