import React from "react";
import { API_BASE_URL } from '../config';

const SongList = ({ songs, onPlay, currentSongId, favorites = [], onFavorite }) => {
  return (
    <div className="song-list">
      {songs.map((song, index) => (
        <div
          className={`song-card ${currentSongId === song.id ? 'active' : ''} ${favorites.includes(song.id) ? 'favorited' : ''}`}
          key={song.id}
        >
          <div className="song-card-overlay">
            <button 
              className="fav-btn" 
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(song.id);
              }}
              title="Add to favorites"
            >
              {favorites.includes(song.id) ? '❤️' : '🤍'}
            </button>
          </div>
          <img 
            src={`${API_BASE_URL}/media/${song.cover}`} 
            alt={song.title}
            onClick={() => onPlay(index)}
          />
          <h3>{song.title}</h3>
          <p>{song.artist}</p>
          <span className="duration">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
        </div>
      ))}
    </div>
  );
};

export default SongList;