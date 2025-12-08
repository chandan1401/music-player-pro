import React, { useEffect, useState } from 'react';

export default function PlaylistManager({ songs, onPlay }) {
  const [lists, setLists] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/playlists')
      .then(r => r.json())
      .then(data => {
        const payload = Array.isArray(data) ? data : data.playlists || [];
        const normalized = payload.map(l => ({
          ...l,
          songIds: l.songIds ?? l.songs ?? []
        }));
        setLists(normalized);
      })
      .catch(() => setLists([]));
  }, []);

  const create = async () => {
    if (!name) return;
    const res = await fetch('http://localhost:4000/api/playlists', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name, songIds:[]})
    });
    const newList = await res.json();
    setLists(prev => [...prev, newList]);
    setName('');
  };

  return (
    <div className="playlists">
      <h3>Playlists</h3>
      <input value={name} placeholder="New playlist" onChange={e=>setName(e.target.value)}/>
      <button onClick={create}>Create</button>

      {lists.map(l => (
        <div key={l.id} className="playlist-card">
          <div>{l.name}</div>
          <button onClick={() => {
            const ids = l.songIds ?? l.songs ?? [];
            if (!ids.length) return;
            const idx = songs.findIndex(s => s.id === ids[0]);
            if (idx !== -1) onPlay(idx);
          }}>Play</button>
        </div>
      ))}
    </div>
  );
}
