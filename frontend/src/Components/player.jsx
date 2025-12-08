import React, { useEffect, useRef, useState } from 'react';

export default function Player({ songs, currentIndex, setCurrentIndex, playing, setPlaying, onFavorite, isFavorite }) {
  const audioRef = useRef(new Audio());
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0); // 0: no repeat, 1: repeat all, 2: repeat one
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
    const onTime = () => setProgress(audio.currentTime);
    const onEnded = () => {
      if (repeat === 2) {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [repeat, volume, songs, currentIndex]);

  useEffect(() => {
    if (currentIndex === null || !songs[currentIndex]) return;
    const audio = audioRef.current;
    audio.src = 'http://localhost:4000/media/' + songs[currentIndex].path;
    audio.playbackRate = playbackSpeed;
    audio.load();
    if (playing) audio.play();
  }, [currentIndex, songs, playbackSpeed]);

  useEffect(() => {
    if (playing) audioRef.current.play();
    else audioRef.current.pause();
  }, [playing]);

  const handleNext = () => {
    if (!songs.length) return;
    if (shuffle) {
      setCurrentIndex(Math.floor(Math.random() * songs.length));
    } else {
      const next = (currentIndex === null ? 0 : (currentIndex + 1) % songs.length);
      setCurrentIndex(next);
    }
    setPlaying(true);
  };

  const handlePrev = () => {
    if (!songs.length) return;
    if (progress > 3) {
      audioRef.current.currentTime = 0;
    } else {
      const prev = (currentIndex === null ? 0 : (currentIndex - 1 + songs.length) % songs.length);
      setCurrentIndex(prev);
    }
    setPlaying(true);
  };

  const seekTo = (t) => {
    audioRef.current.currentTime = t;
    setProgress(t);
  };

  const toggleRepeat = () => {
    setRepeat((prev) => (prev + 1) % 3);
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = () => {
    switch(repeat) {
      case 0: return '🔄';
      case 1: return '🔁';
      case 2: return '🔂';
      default: return '🔄';
    }
  };

  const jumpToSong = (index) => {
    setCurrentIndex(index);
    setPlaying(true);
    setShowQueue(false);
  };

  const upNext = songs.slice(0, 3);

  return (
    <div className="player">
      {songs[currentIndex] ? (
        <div className="player-main">
          <div className="album-cover-box">
            <img 
              src={'http://localhost:4000/media/' + songs[currentIndex].cover} 
              alt="cover" 
              className="album-cover"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+4pmp77iPPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
            <div className="album-info">
              <div className="song-title">{songs[currentIndex].title}</div>
              <div className="song-artist">{songs[currentIndex].artist}</div>
            </div>
          </div>
          
          <div className="controls">
            <div className="playback-controls">
              <button 
                onClick={handlePrev}
                className="control-btn prev-btn"
                title="Previous song"
              >
                ⏮️
              </button>
              
              <button 
                onClick={() => setPlaying(!playing)} 
                className="play-btn"
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? '⏸️' : '▶️'}
              </button>
              
              <button 
                onClick={handleNext}
                className="control-btn next-btn"
                title="Next song"
              >
                ⏭️
              </button>

              <button 
                className={`control-btn ${isFavorite ? 'active' : ''}`}
                onClick={() => onFavorite(songs[currentIndex].id)}
                title="Add to favorites"
              >
                {isFavorite ? '❤️' : '🤍'}
              </button>

              <button 
                className={`control-btn ${shuffle ? 'active' : ''}`}
                onClick={() => setShuffle(!shuffle)}
                title="Toggle shuffle"
              >
                🔀
              </button>

              <button 
                className={`control-btn ${repeat > 0 ? 'active' : ''}`}
                onClick={toggleRepeat}
                title="Toggle repeat"
              >
                {getRepeatIcon()}
              </button>

              <button 
                className={`control-btn ${showQueue ? 'active' : ''}`}
                onClick={() => setShowQueue(!showQueue)}
                title="Show queue"
              >
                📋
              </button>
            </div>

            <div className="progress-bar">
              <input 
                type="range" 
                min="0" 
                max={songs[currentIndex].duration || 300} 
                value={progress}
                onChange={e => seekTo(Number(e.target.value))}
                className="progress-slider"
              />
              <div className="time-display">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(songs[currentIndex].duration)}</span>
              </div>
            </div>

            <div className="audio-controls">
              <div className="volume-control">
                <label>🔊</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume}
                  onChange={e => { 
                    setVolume(Number(e.target.value)); 
                    audioRef.current.volume = Number(e.target.value); 
                  }}
                  className="slider"
                />
                <span>{Math.round(volume * 100)}%</span>
              </div>

              <div className="speed-control">
                <label>⚡</label>
                <select value={playbackSpeed} onChange={e => setPlaybackSpeed(Number(e.target.value))}>
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
            </div>
            
            <div className="player-meta">
              <div className="meta-block">
                <p className="meta-label">Up next</p>
                <div className="meta-list">
                  {upNext.length ? upNext.map((song) => (
                    <span key={song.id} className="pill">{song.title}</span>
                  )) : <span className="pill muted">Add songs to queue</span>}
                </div>
              </div>
              <div className="meta-block">
                <p className="meta-label">Shortcuts</p>
                <div className="meta-list">
                  <span className="pill muted">Space · Play/Pause</span>
                  <span className="pill muted">N · Next</span>
                  <span className="pill muted">P · Previous</span>
                </div>
              </div>
            </div>
          </div>

          {showQueue && (
            <div className="queue-panel">
              <div className="queue-header">
                <h3>📋 Queue</h3>
                <button onClick={() => setShowQueue(false)}>✕</button>
              </div>
              <div className="queue-list">
                {songs.map((song, idx) => (
                  <div
                    key={song.id}
                    className={`queue-item ${currentIndex === idx ? 'active' : ''}`}
                    onClick={() => jumpToSong(idx)}
                  >
                    <span className="queue-number">{idx + 1}</span>
                    <div className="queue-song-info">
                      <div className="queue-title">{song.title}</div>
                      <div className="queue-artist">{song.artist}</div>
                    </div>
                    <span className="queue-duration">{formatTime(song.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="player-main">
          <div className="album-cover-box">
            <div className="album-cover placeholder">
              🎵
            </div>
            <div className="album-info">
              <div className="song-title">Music Player Pro</div>
              <div className="song-artist">Select a track to start playing</div>
            </div>
          </div>
          
          <div className="controls">
            <div className="playback-controls">
              <button 
                className="control-btn prev-btn disabled"
                title="Previous song"
                disabled
              >
                ⏮️
              </button>
              
              <button 
                className="play-btn disabled"
                title="Select a song first"
                disabled
              >
                ⏸️
              </button>
              
              <button 
                className="control-btn next-btn disabled"
                title="Next song"
                disabled
              >
                ⏭️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
