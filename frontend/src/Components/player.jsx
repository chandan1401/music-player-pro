import React, { useCallback, useEffect, useRef, useState } from 'react';

// Helper to properly encode song path for URL
const encodeSongPath = (path) => {
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
};

export default function Player({ songs, currentIndex, setCurrentIndex, queueOrder = [], setQueueOrder = () => {}, currentSongId, playing, setPlaying, onFavorite, isFavorite, onSkip = () => {} }) {
  const audioRefs = useRef([new Audio(), new Audio()]);
  const activeIndexRef = useRef(0);
  const lastLoadedIndexRef = useRef(null);
  const audioCtxRef = useRef(null);
  const gainNodesRef = useRef([]);
  const sourceNodesRef = useRef([]);
  const fadeTimeoutRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0); // 0: no repeat, 1: repeat all, 2: repeat one
  const repeatRef = useRef(repeat);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showQueue, setShowQueue] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [lyricsStatus, setLyricsStatus] = useState('idle');
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(true);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(null);
  const sleepTimerRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  const getActiveAudio = () => audioRefs.current[activeIndexRef.current];
  const getInactiveAudio = () => audioRefs.current[(activeIndexRef.current + 1) % 2];
  const getActiveGain = () => gainNodesRef.current[activeIndexRef.current];
  const getInactiveGain = () => gainNodesRef.current[(activeIndexRef.current + 1) % 2];

  const cancelScheduledFades = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    gainNodesRef.current.forEach((gain) => {
      if (gain && gain.gain) {
        gain.gain.cancelScheduledValues(ctx.currentTime);
      }
    });
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  };

  // Boot Web Audio graph and wire listeners once
  useEffect(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    audioRefs.current.forEach((audioEl, idx) => {
      audioEl.preload = 'auto';
      // Remove crossOrigin since we're using Vite proxy (same origin)
      
      // Add error handler
      const onError = (e) => {
        console.error(`Audio ${idx} error:`, audioEl.error?.message || 'Unknown error', audioEl.src);
        console.error('Error details:', {
          code: audioEl.error?.code,
          message: audioEl.error?.message,
          src: audioEl.src
        });
      };
      audioEl.addEventListener('error', onError);
      
      const source = ctx.createMediaElementSource(audioEl);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(ctx.destination);
      sourceNodesRef.current[idx] = source;
      gainNodesRef.current[idx] = gain;

      const onTime = () => {
        if (activeIndexRef.current === idx) setProgress(audioEl.currentTime);
      };
      const onEnded = () => {
        if (activeIndexRef.current === idx) {
          if (repeatRef.current === 2) {
            audioEl.currentTime = 0;
            audioEl.play();
          } else {
            handleNextRef.current('auto');
          }
        }
      };
      audioEl.addEventListener('timeupdate', onTime);
      audioEl.addEventListener('ended', onEnded);

      // Cleanup per element
      source._cleanup = () => {
        audioEl.removeEventListener('timeupdate', onTime);
        audioEl.removeEventListener('ended', onEnded);
        audioEl.removeEventListener('error', onError);
      };
    });

    return () => {
      cancelScheduledFades();
      audioRefs.current.forEach((audioEl, idx) => {
        audioEl.pause();
        audioEl.src = '';
        audioEl.load();
        sourceNodesRef.current[idx]?._cleanup?.();
        sourceNodesRef.current[idx]?.disconnect();
        gainNodesRef.current[idx]?.disconnect();
      });
      ctx.close();
    };
  }, []);

  // Keep playbackRate in sync for both decks
  useEffect(() => {
    audioRefs.current.forEach((audioEl) => {
      audioEl.playbackRate = playbackSpeed;
    });
  }, [playbackSpeed]);

  const fetchLyrics = useCallback(async (indexOverride = null) => {
    const lookupIndex = indexOverride !== null ? indexOverride : currentIndex;
    if (lookupIndex === null || !songs[lookupIndex]) {
      setLyrics('');
      setLyricsStatus('idle');
      return;
    }
    const song = songs[lookupIndex];
    setLyricsStatus('loading');
    try {
      const res = await fetch(`/api/lyrics/${encodeURIComponent(song.artist || 'Unknown')}/${encodeURIComponent(song.title || 'track')}`);
      if (!res.ok) throw new Error('No lyrics');
      const data = await res.json();
      setLyrics(data.lyrics || 'Lyrics unavailable.');
      setLyricsStatus('done');
    } catch (e) {
      setLyrics('Lyrics unavailable for this track.');
      setLyricsStatus('error');
    }
  }, [currentIndex, songs]);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  const primeActiveDeck = useCallback((indexToLoad, autoPlay = false) => {
    if (indexToLoad === null || !songs[indexToLoad]) return;
    const ctx = audioCtxRef.current;
    const audio = getActiveAudio();
    const gain = getActiveGain();
    const encodedPath = encodeSongPath(songs[indexToLoad].path);
    const fullUrl = `/media/${encodedPath}`;
    console.log('Loading song:', songs[indexToLoad].title, 'URL:', fullUrl);
    audio.src = fullUrl;
    audio.playbackRate = playbackSpeed;
    audio.load();
    audio.currentTime = 0;
    if (ctx && ctx.state === 'suspended' && autoPlay) ctx.resume();
    if (gain && ctx) {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(autoPlay ? volume : 0, ctx.currentTime + 0.01);
    }
    if (autoPlay && playing) audio.play();
    else audio.pause();
    lastLoadedIndexRef.current = indexToLoad;
    fetchLyrics(indexToLoad);
  }, [fetchLyrics, playbackSpeed, playing, songs, volume]);

  useEffect(() => {
    // Initial load or external selection
    if (currentIndex === null || !songs[currentIndex]) return;
    if (lastLoadedIndexRef.current === currentIndex) return;
    primeActiveDeck(currentIndex, playing);
  }, [currentIndex, songs, playing, primeActiveDeck]);

  useEffect(() => {
    const audio = getActiveAudio();
    const ctx = audioCtxRef.current;
    if (!audio) return;
    if (playing) {
      if (ctx && ctx.state === 'suspended') ctx.resume();
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime + 0.01;
    gainNodesRef.current.forEach((gain, idx) => {
      if (!gain) return;
      gain.gain.cancelScheduledValues(now);
      const isActive = idx === activeIndexRef.current;
      const target = isActive && playing ? volume : 0;
      gain.gain.setValueAtTime(target, now);
    });
  }, [playing, volume]);

  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, []);

  const performCrossfade = useCallback((nextIndex, reason = 'auto') => {
    if (nextIndex === null || nextIndex === undefined || !songs[nextIndex]) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    cancelScheduledFades();
    const hostname = window.location.hostname;
    const currentAudio = getActiveAudio();
    const incomingAudio = getInactiveAudio();
    const currentGain = getActiveGain();
    const incomingGain = getInactiveGain();
    if (!incomingGain || !currentGain) return;

    const fadeSeconds = crossfadeEnabled ? Math.min(Math.max(crossfadeDuration, 1), 10) : 0;
    const targetVolume = volume;
    const now = ctx.currentTime + 0.02; // slight offset to avoid crackle

    const encodedPath = encodeSongPath(songs[nextIndex].path);
    const fullUrl = `/media/${encodedPath}`;
    console.log('Crossfading to:', songs[nextIndex].title, 'URL:', fullUrl);
    incomingAudio.src = fullUrl;
    incomingAudio.playbackRate = playbackSpeed;
    incomingAudio.load();
    incomingAudio.currentTime = 0;

    // Reset gains before scheduling ramps
    incomingGain.gain.cancelScheduledValues(now);
    currentGain.gain.cancelScheduledValues(now);
    incomingGain.gain.setValueAtTime(0.0001, now);
    currentGain.gain.setValueAtTime(currentGain.gain.value || targetVolume, now);

    if (ctx.state === 'suspended') ctx.resume();

    // Begin playback on both decks so fades overlap cleanly
    incomingAudio.play().catch(() => {});
    currentAudio.play().catch(() => {});

    setCurrentIndex(nextIndex);
    setPlaying(true);
    lastLoadedIndexRef.current = nextIndex;
    fetchLyrics(nextIndex);

    if (fadeSeconds > 0) {
      incomingGain.gain.linearRampToValueAtTime(targetVolume, now + fadeSeconds);
      currentGain.gain.linearRampToValueAtTime(0.0001, now + fadeSeconds);

      fadeTimeoutRef.current = setTimeout(() => {
        currentAudio.pause();
        currentAudio.src = '';
        currentGain.gain.setValueAtTime(0, audioCtxRef.current?.currentTime || 0);
        activeIndexRef.current = (activeIndexRef.current + 1) % 2;
        setProgress(incomingAudio.currentTime);
      }, fadeSeconds * 1000 + 80);
    } else {
      // Instant switch when crossfade disabled
      currentGain.gain.setValueAtTime(0, now);
      incomingGain.gain.setValueAtTime(targetVolume, now + 0.01);
      currentAudio.pause();
      currentAudio.src = '';
      activeIndexRef.current = (activeIndexRef.current + 1) % 2;
      setProgress(incomingAudio.currentTime);
    }
  }, [crossfadeDuration, crossfadeEnabled, fetchLyrics, playbackSpeed, setCurrentIndex, setPlaying, songs, volume]);

  const computedQueue = queueOrder && queueOrder.length ? queueOrder : songs.map(s => s.id);

  const handleNext = useCallback((reason = 'manual') => {
    if (!songs.length) return;
    const currentIdBefore = currentSongId ?? songs[currentIndex]?.id;
    if (reason === 'manual' && currentIdBefore) {
      onSkip(currentIdBefore);
    }
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * computedQueue.length);
      const songId = computedQueue[randomIndex];
      const songIdx = songs.findIndex(s => s.id === songId);
      performCrossfade(songIdx, reason);
      return;
    }
    const currentId = currentSongId ?? songs[currentIndex]?.id;
    const pos = currentId ? computedQueue.indexOf(currentId) : -1;
    const nextId = computedQueue[(pos + 1 + computedQueue.length) % computedQueue.length];
    const nextIdx = songs.findIndex(s => s.id === nextId);
    performCrossfade(nextIdx, reason);
  }, [computedQueue, currentIndex, currentSongId, onSkip, performCrossfade, shuffle, songs]);

  const handlePrev = useCallback(() => {
    if (!songs.length) return;
    const activeAudio = getActiveAudio();
    if (progress > 3) {
      activeAudio.currentTime = 0;
    } else {
      const currentId = currentSongId ?? songs[currentIndex]?.id;
      const pos = currentId ? computedQueue.indexOf(currentId) : -1;
      const prevId = computedQueue[(pos - 1 + computedQueue.length) % computedQueue.length];
      const prevIdx = songs.findIndex(s => s.id === prevId);
      performCrossfade(prevIdx, 'manual');
    }
    setPlaying(true);
  }, [computedQueue, currentIndex, currentSongId, performCrossfade, progress, songs, setPlaying]);

  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  const seekTo = (t) => {
    const audio = getActiveAudio();
    audio.currentTime = t;
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
    performCrossfade(index, 'manual');
    setShowQueue(false);
  };

  const upNext = (() => {
    if (!computedQueue.length) return [];
    const currentId = currentSongId ?? songs[currentIndex]?.id;
    const start = Math.max(computedQueue.indexOf(currentId), 0);
    const ids = [];
    for (let i = 1; i <= 3; i++) {
      ids.push(computedQueue[(start + i) % computedQueue.length]);
    }
    return ids.map(id => songs.find(s => s.id === id)).filter(Boolean);
  })();

  const onDragStart = (id) => setDraggingId(id);
  const onDrop = (targetId) => {
    if (!draggingId || draggingId === targetId) return;
    const nextOrder = computedQueue.filter(id => id !== draggingId);
    const targetIndex = nextOrder.indexOf(targetId);
    nextOrder.splice(targetIndex, 0, draggingId);
    setQueueOrder(nextOrder);
    setDraggingId(null);
  };

  const cancelSleepTimer = () => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    setSleepTimerMinutes(null);
  };

  const setSleepTimer = (minutes) => {
    cancelSleepTimer();
    if (!minutes) return;
    setSleepTimerMinutes(minutes);
    sleepTimerRef.current = setTimeout(() => {
      setPlaying(false);
      const audio = getActiveAudio();
      audio.pause();
      setSleepTimerMinutes(null);
    }, minutes * 60 * 1000);
  };

  // Don't render the player at all if no song is selected
  if (currentIndex === null || !songs[currentIndex]) {
    return null;
  }

  return (
    <div className="player">
      <div className="player-main">
          <div className="album-cover-box">
            <img 
              src={`/media/${songs[currentIndex].cover}`} 
              alt="cover" 
              className={`album-cover ${playing ? 'playing' : ''}`}
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
                onClick={() => handleNext('manual')}
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
                    const nextVol = Number(e.target.value);
                    setVolume(nextVol); 
                    const gain = getActiveGain();
                    const ctx = audioCtxRef.current;
                    if (gain && ctx) {
                      const now = ctx.currentTime + 0.01;
                      gain.gain.cancelScheduledValues(now);
                      gain.gain.setValueAtTime(playing ? nextVol : 0, now);
                    }
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
                </select>
              </div>

              <div className="crossfade-control">
                <label>🌊</label>
                <input
                  type="checkbox"
                  checked={crossfadeEnabled}
                  onChange={(e) => setCrossfadeEnabled(e.target.checked)}
                  title="Toggle crossfade"
                />
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={crossfadeDuration}
                  onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                  title="Crossfade seconds"
                />
                <span className="slider-value">{crossfadeDuration.toFixed(1)}s</span>
              </div>

              <div className="sleep-control">
                <label>⏱️</label>
                <select value={sleepTimerMinutes || ''} onChange={(e) => setSleepTimer(Number(e.target.value))}>
                  <option value="">Sleep timer</option>
                  <option value={10}>10 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                </select>
                {sleepTimerMinutes && (
                  <button className="mini-btn" onClick={cancelSleepTimer} title="Cancel timer">✕</button>
                )}
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

          <div className="lyrics-panel">
            <div className="lyrics-header">🎤 Lyrics</div>
            {lyricsStatus === 'loading' && <div className="muted">Fetching lyrics...</div>}
            {lyrics && <pre className="lyrics-body">{lyrics}</pre>}
          </div>
          </div>

          {showQueue && (
            <div className="queue-panel">
              <div className="queue-header">
                <h3>📋 Queue</h3>
                <button onClick={() => setShowQueue(false)}>✕</button>
              </div>
              <div className="queue-list">
                {computedQueue.map((songId, idx) => {
                  const song = songs.find(s => s.id === songId);
                  if (!song) return null;
                  const songIdx = songs.indexOf(song);
                  return (
                    <div
                      key={song.id}
                      className={`queue-item ${currentSongId === songId ? 'active' : ''}`}
                      draggable
                      onDragStart={() => onDragStart(songId)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDrop(songId)}
                      onClick={() => jumpToSong(songIdx)}
                    >
                      <span className="queue-number">{idx + 1}</span>
                      <div className="queue-song-info">
                        <div className="queue-title">{song.title}</div>
                        <div className="queue-artist">{song.artist}</div>
                      </div>
                      <span className="queue-duration">{formatTime(song.duration)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
