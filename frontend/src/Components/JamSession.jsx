import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function JamSession({ songs, onPlaySong, onBack }) {
  const [socket, setSocket] = useState(null);
  const [isInSession, setIsInSession] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [userName, setUserName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [inputName, setInputName] = useState('');
  const [session, setSession] = useState(null);
  const [userId, setUserId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [syncTimestamp, setSyncTimestamp] = useState(null);
  
  const socketRef = useRef(null);
  const audioRef = useRef(new Audio());
  const syncingRef = useRef(false); // Prevent sync loops

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    let isManualPause = false; // Track if pause was triggered by user
    
    const handleEnded = () => {
      console.log('🎵 Song ended');
      setIsPlaying(false);
      // Auto-play next song if host
      if (userId === session?.hostId && queue.length > 0) {
        console.log('⏭️ Auto-playing next song (host)');
        setTimeout(() => playNext(), 500); // Small delay before next song
      }
    };
    
    const handlePause = () => {
      console.log('⏸️ Audio paused');
      setIsPlaying(false);
    };
    
    const handlePlay = () => {
      console.log('▶️ Audio playing');
      setIsPlaying(true);
    };
    
    const handleError = (e) => {
      console.error('❌ Audio error:', e);
      setIsPlaying(false);
    };
    
    const handleLoadedData = () => {
      console.log('✅ Audio loaded and ready');
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadeddata', handleLoadedData);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [userId, session, queue]);

  // Initialize socket connection
  useEffect(() => {
    // Connect to backend through Vite proxy using current origin
    const backendUrl = window.location.protocol === 'https:' ? 'http://localhost:4000' : 'http://localhost:4000';
    
    console.log('Connecting to backend:', backendUrl);
    const newSocket = io(backendUrl);
    socketRef.current = newSocket;
    setSocket(newSocket);
    
    // Set default audio volume
    audioRef.current.volume = 0.8;

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      // Stop any playing jam audio when leaving the view
      audioRef.current.pause();
      audioRef.current.src = '';
    };
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('session-joined', (data) => {
      console.log('✅ SESSION-JOINED EVENT:', data);
      setSession(data.session);
      setUserId(data.userId);
      setIsInSession(true);
      setQueue(data.session.queue || []);
      setCurrentSong(data.session.currentSong);
      setParticipants(data.session.participants || []);
      showNotification('✅ Joined session successfully!', 'success');
      
      // If there's already a song playing when joining, start playing it
      if (data.session.currentSong) {
        console.log('🎵 Song already playing, starting playback:', data.session.currentSong.song.title);
        const hostname = window.location.hostname;
        const audioUrl = `/media/${data.session.currentSong.song.path}`;
        console.log('🎵 Audio URL:', audioUrl);
        
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        
        setTimeout(() => {
          audioRef.current.play()
            .then(() => {
              console.log('✅ Started playing existing song');
              setIsPlaying(true);
              setSyncTimestamp(Date.now());
            })
            .catch(err => console.error('❌ Failed to play existing song:', err));
        }, 100);
      }
    });

    socket.on('participant-joined', (data) => {
      setParticipants(prev => [...prev, data.participant]);
      showNotification(`🎉 ${data.participant.name} joined the session`, 'info');
    });

    socket.on('participant-left', (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
      if (data.newHost) {
        showNotification('👑 You are now the host!', 'info');
      }
    });

    socket.on('queue-updated', (data) => {
      setQueue(data.queue || []);
    });

    socket.on('now-playing', (data) => {
      console.log('🎵 NOW-PLAYING EVENT RECEIVED:', data);
      setCurrentSong(data.song);
      setQueue(data.queue || []);
      showNotification(`🎵 Now playing: ${data.song.song.title}`, 'info');
      
      // Play in the jam session's audio player for ALL participants
      const hostname = window.location.hostname;
      const audioUrl = `/media/${data.song.song.path}`;
      console.log('🎵 Playing audio from:', audioUrl);
      
      // Stop current playback first
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Set new source and play
      audioRef.current.src = audioUrl;
      audioRef.current.load(); // Force reload
      
      // Small delay to ensure audio is loaded, then play
      setTimeout(() => {
        audioRef.current.play()
          .then(() => {
            console.log('✅ Audio playing successfully');
            setIsPlaying(true);
            setSyncTimestamp(Date.now());
          })
          .catch(err => console.error('❌ Playback error:', err));
      }, 100);
    });

    socket.on('playback-sync', (state) => {
      console.log('🔄 Playback sync received:', state);
      
      // Skip if we're the host (we already performed the action)
      if (userId === session?.hostId) {
        console.log('⚠️ Skipping sync (I am the host)');
        return;
      }
      
      // Prevent sync loops
      if (syncingRef.current) {
        console.log('⚠️ Skipping sync (already syncing)');
        return;
      }
      
      syncingRef.current = true;
      
      if (state.action === 'pause') {
        console.log('⏸️ Syncing pause from host');
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (state.action === 'play') {
        console.log('▶️ Syncing play from host');
        audioRef.current.play().catch(err => console.error('Sync play error:', err));
        setIsPlaying(true);
      } else if (state.action === 'seek' && state.currentTime !== undefined) {
        console.log('⏩ Syncing seek to:', state.currentTime);
        audioRef.current.currentTime = state.currentTime;
      }
      
      setTimeout(() => { syncingRef.current = false; }, 200);
    });

    socket.on('recommendations', (data) => {
      setRecommendations(data.songs || []);
    });

    socket.on('error', (data) => {
      showNotification(`❌ Error: ${data.message}`, 'error');
    });

    return () => {
      socket.off('session-joined');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('queue-updated');
      socket.off('now-playing');
      socket.off('playback-sync');
      socket.off('recommendations');
      socket.off('error');
    };
  }, [socket, onPlaySong]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const createSession = async () => {
    if (!inputName.trim()) {
      showNotification('Please enter your name', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/jam/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: inputName })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessionCode(data.sessionCode);
        setUserName(inputName);
        socket.emit('join-session', {
          sessionCode: data.sessionCode,
          userName: inputName,
          userId: data.hostId
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      showNotification('Failed to create session', 'error');
    }
  };

  const joinSession = () => {
    if (!inputCode.trim() || !inputName.trim()) {
      showNotification('Please enter session code and your name', 'error');
      return;
    }

    setSessionCode(inputCode.toUpperCase());
    setUserName(inputName);
    socket.emit('join-session', {
      sessionCode: inputCode.toUpperCase(),
      userName: inputName
    });
    setShowJoinForm(false);
  };

  const leaveSession = () => {
    socket.emit('leave-session');
    setIsInSession(false);
    setSession(null);
    setQueue([]);
    setCurrentSong(null);
    setParticipants([]);
    setSessionCode('');
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    showNotification('👋 Left the session', 'info');
  };

  const addToQueue = (song) => {
    socket.emit('add-to-queue', { song });
    showNotification(`Added "${song.title}" to queue`, 'success');
  };

  const vote = (queueItemId, voteValue) => {
    socket.emit('vote', { queueItemId, voteValue });
  };

  const removeFromQueue = (queueItemId) => {
    socket.emit('remove-from-queue', { queueItemId });
  };

  const playNext = () => {
    socket.emit('play-next');
  };

  const getRecommendations = () => {
    socket.emit('get-recommendations', { allSongs: songs });
    showNotification('🤖 Getting AI recommendations...', 'info');
  };

  const getUserVote = (queueItem) => {
    if (!queueItem.votes || !userId) return 0;
    return queueItem.votes[userId] || 0;
  };

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Not in session view
  if (!isInSession) {
    return (
      <div style={styles.container}>
        <button 
          onClick={onBack} 
          style={styles.backButtonWelcome} 
          title="Back to Music Player"
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 10px 25px rgba(184, 134, 11, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 20px rgba(184, 134, 11, 0.3)';
          }}
        >
          <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>←</span>
          <span>Back</span>
        </button>
        <div style={styles.welcomeCard}>
          <h1 style={styles.title}>🎵 Jam Session</h1>
          <p style={styles.subtitle}>
            Create or join a collaborative listening session where everyone can add songs and vote!
          </p>

          {!showCreateForm && !showJoinForm && (
            <div style={styles.buttonGroup}>
              <button 
                style={styles.primaryButton}
                onClick={() => setShowCreateForm(true)}
              >
                🎸 Create New Session
              </button>
              <button 
                style={styles.secondaryButton}
                onClick={() => setShowJoinForm(true)}
              >
                🎤 Join Existing Session
              </button>
            </div>
          )}

          {showCreateForm && (
            <div style={styles.form}>
              <h3 style={styles.formTitle}>Create a Jam Session</h3>
              <input
                type="text"
                placeholder="Your name"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                style={styles.input}
                maxLength={20}
              />
              <div style={styles.formButtons}>
                <button onClick={createSession} style={styles.primaryButton}>
                  Create Session
                </button>
                <button 
                  onClick={() => setShowCreateForm(false)} 
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showJoinForm && (
            <div style={styles.form}>
              <h3 style={styles.formTitle}>Join a Jam Session</h3>
              <input
                type="text"
                placeholder="Session Code (e.g., ABC123)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                style={styles.input}
                maxLength={6}
              />
              <input
                type="text"
                placeholder="Your name"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                style={styles.input}
                maxLength={20}
              />
              <div style={styles.formButtons}>
                <button onClick={joinSession} style={styles.primaryButton}>
                  Join Session
                </button>
                <button 
                  onClick={() => setShowJoinForm(false)} 
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {notification && (
          <div style={{...styles.notification, ...styles[notification.type]}}>
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  // In session view
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          onClick={onBack} 
          style={styles.backButton} 
          title="Back to Music Player"
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 3px 10px rgba(102, 126, 234, 0.25)';
          }}
        >
          ← Back
        </button>
        <div style={styles.sessionInfo}>
          <h2 style={styles.sessionTitle}>
            🎵 Session: <span style={styles.code}>{sessionCode}</span>
          </h2>
          <div style={styles.participantsBadge}>
            👥 {participants.length} {participants.length === 1 ? 'person' : 'people'}
          </div>
        </div>
        <button onClick={leaveSession} style={styles.leaveButton}>
          Leave Session
        </button>
      </div>

      <div style={styles.mainContent}>
        {/* Left sidebar - Participants */}
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Participants</h3>
          <div style={styles.participantsList}>
            {participants.map((p, idx) => (
              <div key={idx} style={styles.participant}>
                <span style={styles.participantIcon}>
                  {p.id === session?.hostId ? '👑' : '🎧'}
                </span>
                <span style={styles.participantName}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Queue */}
        <div style={styles.centerPanel}>
          {/* Now Playing */}
          {currentSong && (
            <div style={styles.nowPlaying}>
              <h3 style={styles.nowPlayingTitle}>🎵 Now Playing</h3>
              <div style={styles.nowPlayingInfo}>
                <div style={styles.songTitle}>{currentSong.song.title}</div>
                <div style={styles.songArtist}>{currentSong.song.artist}</div>
                <div style={styles.addedBy}>Added by {currentSong.addedBy}</div>
              </div>
              
              {/* Playback Controls */}
              <div style={styles.playbackControls}>
                <button 
                  onClick={() => {
                    if (isPlaying) {
                      audioRef.current.pause();
                      setIsPlaying(false);
                      // If host, sync pause to all participants
                      if (userId === session?.hostId) {
                        socket.emit('playback-update', { 
                          action: 'pause',
                          currentTime: audioRef.current.currentTime
                        });
                      }
                    } else {
                      audioRef.current.play();
                      setIsPlaying(true);
                      // If host, sync play to all participants
                      if (userId === session?.hostId) {
                        socket.emit('playback-update', { 
                          action: 'play',
                          currentTime: audioRef.current.currentTime
                        });
                      }
                    }
                  }} 
                  style={styles.playButton}
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <button 
                  onClick={() => {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play();
                    setIsPlaying(true);
                    // If host, sync restart to all participants
                    if (userId === session?.hostId) {
                      socket.emit('playback-update', { 
                        action: 'seek',
                        currentTime: 0
                      });
                      socket.emit('playback-update', { 
                        action: 'play',
                        currentTime: 0
                      });
                    }
                  }} 
                  style={styles.restartButton}
                >
                  🔄 Restart
                </button>
              </div>
              
              {userId === session?.hostId && (
                <button 
                  onClick={() => {
                    console.log('⏭️ Next button clicked by host');
                    playNext();
                  }} 
                  style={styles.nextButton}
                >
                  ⏭️ Next Song
                </button>
              )}
            </div>
          )}

          {/* Queue */}
          <div style={styles.queueSection}>
            <h3 style={styles.queueTitle}>
              Queue ({queue.length})
              {userId === session?.hostId && queue.length > 0 && !currentSong && (
                <button onClick={playNext} style={styles.startButton}>
                  ▶️ Start
                </button>
              )}
            </h3>
            
            {queue.length === 0 ? (
              <div style={styles.emptyQueue}>
                <p>🎼 Queue is empty</p>
                <p style={styles.emptyQueueHint}>Add songs to get started!</p>
              </div>
            ) : (
              <div style={styles.queueList}>
                {queue.map((item, idx) => (
                  <div key={item.id} style={styles.queueItem}>
                    <div style={styles.queueItemLeft}>
                      <span style={styles.queuePosition}>{idx + 1}</span>
                      <div style={styles.queueItemInfo}>
                        <div style={styles.queueItemTitle}>{item.song.title}</div>
                        <div style={styles.queueItemArtist}>
                          {item.song.artist} • Added by {item.addedBy}
                        </div>
                      </div>
                    </div>
                    
                    <div style={styles.queueItemRight}>
                      <div style={styles.voteSection}>
                        <button
                          onClick={() => vote(item.id, getUserVote(item) === 1 ? 0 : 1)}
                          style={{
                            ...styles.voteButton,
                            ...(getUserVote(item) === 1 ? styles.voteButtonActive : {})
                          }}
                        >
                          👍
                        </button>
                        <span style={styles.voteCount}>{item.score}</span>
                        <button
                          onClick={() => vote(item.id, getUserVote(item) === -1 ? 0 : -1)}
                          style={{
                            ...styles.voteButton,
                            ...(getUserVote(item) === -1 ? styles.voteButtonActive : {})
                          }}
                        >
                          👎
                        </button>
                      </div>
                      
                      {(item.userId === userId || session?.hostId === userId) && (
                        <button
                          onClick={() => removeFromQueue(item.id)}
                          style={styles.removeButton}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar - Add songs */}
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Add Songs</h3>
          
          <input
            type="text"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />

          <button onClick={getRecommendations} style={styles.aiButton}>
            🤖 AI Suggestions
          </button>

          <div style={styles.songsList}>
            {recommendations.length > 0 && (
              <>
                <div style={styles.recommendationsHeader}>
                  ✨ Recommended for you
                </div>
                {recommendations.map((song) => (
                  <div key={`rec-${song.id}`} style={styles.songItem}>
                    <div style={styles.songInfo}>
                      <div style={styles.songItemTitle}>{song.title}</div>
                      <div style={styles.songItemArtist}>{song.artist}</div>
                    </div>
                    <button
                      onClick={() => addToQueue(song)}
                      style={styles.addButton}
                      disabled={queue.some(q => q.song.id === song.id)}
                    >
                      {queue.some(q => q.song.id === song.id) ? '✓' : '+'}
                    </button>
                  </div>
                ))}
                <div style={styles.divider}></div>
              </>
            )}

            {filteredSongs.slice(0, 20).map((song) => (
              <div key={song.id} style={styles.songItem}>
                <div style={styles.songInfo}>
                  <div style={styles.songItemTitle}>{song.title}</div>
                  <div style={styles.songItemArtist}>{song.artist}</div>
                </div>
                <button
                  onClick={() => addToQueue(song)}
                  style={styles.addButton}
                  disabled={queue.some(q => q.song.id === song.id)}
                >
                  {queue.some(q => q.song.id === song.id) ? '✓' : '+'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {notification && (
        <div style={{...styles.notification, ...styles[notification.type]}}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f4e4bc 0%, #e8d5a3 50%, #d4c4a0 100%)',
    padding: '20px',
    fontFamily: 'Cormorant Garamond, serif',
    position: 'relative',
  },
  welcomeCard: {
    maxWidth: '500px',
    margin: '100px auto',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(244, 228, 188, 0.9) 100%)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(61, 41, 20, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    position: 'relative',
    border: '1px solid rgba(184, 134, 11, 0.25)',
    backdropFilter: 'blur(20px)',
  },
  backButtonWelcome: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(218, 165, 32, 0.9) 100%)',
    border: '1px solid rgba(218, 165, 32, 0.5)',
    borderRadius: '14px',
    padding: '0.75rem 1.35rem',
    color: '#fff8e7',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 20px rgba(184, 134, 11, 0.3)',
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'Cormorant Garamond, serif',
    zIndex: 10,
  },
  backButtonWelcomeHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 25px rgba(184, 134, 11, 0.4)',
  },
  title: {
    fontSize: '2.5rem',
    margin: '0 0 10px 0',
    color: '#3d2914',
    fontFamily: 'Cinzel, serif',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#5c4033',
    marginBottom: '30px',
    lineHeight: '1.6',
    fontFamily: 'Cormorant Garamond, serif',
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '12px 26px',
    fontSize: '1rem',
    background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(218, 165, 32, 0.9) 100%)',
    color: '#fff8e7',
    border: '1px solid rgba(218, 165, 32, 0.5)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    boxShadow: '0 8px 20px rgba(184, 134, 11, 0.3)',
    fontFamily: 'Cormorant Garamond, serif',
  },
  secondaryButton: {
    padding: '12px 26px',
    fontSize: '1rem',
    background: 'linear-gradient(135deg, rgba(61, 41, 20, 0.9) 0%, rgba(45, 30, 15, 0.9) 100%)',
    color: '#f4e4bc',
    border: '1px solid rgba(184, 134, 11, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    boxShadow: '0 8px 20px rgba(61, 41, 20, 0.25)',
    fontFamily: 'Cormorant Garamond, serif',
  },
  form: {
    marginTop: '20px',
  },
  formTitle: {
    fontSize: '1.3rem',
    marginBottom: '20px',
    color: '#3d2914',
    fontFamily: 'Cinzel, serif',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '2px solid rgba(184, 134, 11, 0.3)',
    borderRadius: '8px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    background: 'rgba(255, 255, 255, 0.6)',
    color: '#3d2914',
    fontFamily: 'Cormorant Garamond, serif',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '1rem',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
    color: '#3d2914',
    border: '1px solid rgba(184, 134, 11, 0.3)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(61, 41, 20, 0.1)',
    fontFamily: 'Cormorant Garamond, serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(244, 228, 188, 0.85) 100%)',
    padding: '20px',
    borderRadius: '15px',
    marginBottom: '20px',
    boxShadow: '0 4px 15px rgba(61, 41, 20, 0.15)',
    gap: '15px',
    border: '1px solid rgba(184, 134, 11, 0.2)',
  },
  backButton: {
    background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(218, 165, 32, 0.9) 100%)',
    border: '1px solid rgba(218, 165, 32, 0.5)',
    borderRadius: '12px',
    padding: '0.75rem 1.4rem',
    color: '#fff8e7',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 8px 20px rgba(184, 134, 11, 0.25)',
    whiteSpace: 'nowrap',
    fontFamily: 'Cormorant Garamond, serif',
  },
  sessionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flex: 1,
  },
  sessionTitle: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#3d2914',
    fontFamily: 'Cinzel, serif',
  },
  code: {
    color: '#b8860b',
    fontWeight: 'bold',
    letterSpacing: '2px',
  },
  participantsBadge: {
    background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(218, 165, 32, 0.9) 100%)',
    color: '#fff8e7',
    padding: '8px 16px',
    borderRadius: '22px',
    fontSize: '0.9rem',
    fontWeight: '600',
    boxShadow: '0 6px 16px rgba(184, 134, 11, 0.25)',
  },
  leaveButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #c44536 0%, #a33327 100%)',
    color: '#fff8f8',
    border: '1px solid rgba(196, 69, 54, 0.5)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    boxShadow: '0 8px 20px rgba(196, 69, 54, 0.25)',
    fontFamily: 'Cormorant Garamond, serif',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '250px 1fr 300px',
    gap: '20px',
    height: 'calc(100vh - 150px)',
  },
  sidebar: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(244, 228, 188, 0.85) 100%)',
    borderRadius: '15px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(61, 41, 20, 0.15)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(184, 134, 11, 0.2)',
  },
  sidebarTitle: {
    margin: '0 0 15px 0',
    fontSize: '1.2rem',
    color: '#3d2914',
    fontFamily: 'Cinzel, serif',
  },
  participantsList: {
    overflowY: 'auto',
    flex: 1,
  },
  participant: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    marginBottom: '5px',
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '8px',
    border: '1px solid rgba(184, 134, 11, 0.15)',
  },
  participantIcon: {
    fontSize: '1.2rem',
  },
  participantName: {
    fontSize: '0.95rem',
    color: '#3d2914',
  },
  centerPanel: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(244, 228, 188, 0.85) 100%)',
    borderRadius: '15px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(61, 41, 20, 0.15)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(184, 134, 11, 0.2)',
  },
  nowPlaying: {
    background: 'linear-gradient(135deg, rgba(61, 41, 20, 0.9) 0%, rgba(45, 30, 15, 0.9) 100%)',
    color: '#f4e4bc',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid rgba(184, 134, 11, 0.3)',
  },
  nowPlayingHeader: {
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '10px',
    opacity: 0.9,
    color: '#daa520',
  },
  nowPlayingContent: {
    marginBottom: '15px',
  },
  songTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '5px',
    fontFamily: 'Cinzel, serif',
  },
  songArtist: {
    fontSize: '1.1rem',
    opacity: 0.9,
    marginBottom: '5px',
    fontFamily: 'Cormorant Garamond, serif',
  },
  addedBy: {
    fontSize: '0.85rem',
    opacity: 0.8,
  },
  nextButton: {
    padding: '12px 22px',
    background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(218, 165, 32, 0.9) 100%)',
    color: '#fff8e7',
    border: '1px solid rgba(218, 165, 32, 0.5)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    boxShadow: '0 8px 20px rgba(184, 134, 11, 0.3)',
    fontFamily: 'Cormorant Garamond, serif',
  },
  queueSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  queueTitle: {
    margin: '0 0 15px 0',
    fontSize: '1.2rem',
    color: '#3d2914',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'Cinzel, serif',
  },
  startButton: {
    padding: '10px 18px',
    background: 'linear-gradient(135deg, rgba(76, 120, 72, 0.9) 0%, rgba(56, 100, 52, 0.9) 100%)',
    color: '#f8fff8',
    border: '1px solid rgba(76, 120, 72, 0.5)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    boxShadow: '0 8px 20px rgba(76, 120, 72, 0.25)',
    fontFamily: 'Cormorant Garamond, serif',
  },
  emptyQueue: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#8b7355',
  },
  emptyQueueHint: {
    fontSize: '0.9rem',
    marginTop: '10px',
  },
  queueList: {
    overflowY: 'auto',
    flex: 1,
  },
  queueItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    marginBottom: '10px',
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '10px',
    border: '1px solid rgba(184, 134, 11, 0.2)',
  },
  queueItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flex: 1,
  },
  queuePosition: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#b8860b',
    minWidth: '30px',
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#3d2914',
    marginBottom: '3px',
    fontFamily: 'Cormorant Garamond, serif',
  },
  queueItemArtist: {
    fontSize: '0.85rem',
    color: '#5c4033',
  },
  queueItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  voteSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.6)',
    padding: '5px 10px',
    borderRadius: '20px',
    border: '1px solid rgba(184, 134, 11, 0.2)',
  },
  voteButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '5px',
    opacity: 0.5,
    transition: 'opacity 0.2s',
  },
  voteButtonActive: {
    opacity: 1,
    transform: 'scale(1.2)',
  },
  voteCount: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#3d2914',
    minWidth: '25px',
    textAlign: 'center',
  },
  removeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    padding: '5px',
    opacity: 0.5,
  },
  searchInput: {
    width: '100%',
    padding: '10px',
    border: '2px solid rgba(184, 134, 11, 0.3)',
    borderRadius: '8px',
    fontSize: '0.95rem',
    marginBottom: '10px',
    boxSizing: 'border-box',
    background: 'rgba(255, 255, 255, 0.6)',
    color: '#3d2914',
    fontFamily: 'Cormorant Garamond, serif',
  },
  aiButton: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(218, 165, 32, 0.9) 100%)',
    color: '#fff8e7',
    border: '1px solid rgba(218, 165, 32, 0.5)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    marginBottom: '15px',
    fontSize: '1rem',
    boxShadow: '0 8px 20px rgba(184, 134, 11, 0.25)',
    fontFamily: 'Cormorant Garamond, serif',
  },
  songsList: {
    overflowY: 'auto',
    flex: 1,
  },
  recommendationsHeader: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#b8860b',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  divider: {
    height: '1px',
    background: 'rgba(184, 134, 11, 0.2)',
    margin: '15px 0',
  },
  songItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '5px',
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid rgba(184, 134, 11, 0.15)',
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
  },
  songItemTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#3d2914',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  songItemArtist: {
    fontSize: '0.8rem',
    color: '#5c4033',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  addButton: {
    background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(218, 165, 32, 0.9) 100%)',
    color: '#fff8e7',
    border: '1px solid rgba(218, 165, 32, 0.5)',
    borderRadius: '50%',
    width: '34px',
    height: '34px',
    cursor: 'pointer',
    fontSize: '1.15rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 6px 15px rgba(184, 134, 11, 0.25)',
  },
  notification: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    padding: '15px 25px',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(61, 41, 20, 0.25)',
    fontWeight: '600',
    animation: 'slideIn 0.3s ease',
    zIndex: 1000,
    fontFamily: 'Cormorant Garamond, serif',
  },
  success: {
    background: 'linear-gradient(135deg, #4c7848 0%, #386434 100%)',
    color: '#f8fff8',
  },
  error: {
    background: 'linear-gradient(135deg, #c44536 0%, #a33327 100%)',
    color: '#fff8f8',
  },
  info: {
    background: 'linear-gradient(135deg, rgba(61, 41, 20, 0.9) 0%, rgba(45, 30, 15, 0.9) 100%)',
    color: '#f4e4bc',
  },
  playbackControls: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    justifyContent: 'center',
  },
  playButton: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, rgba(76, 120, 72, 0.9) 0%, rgba(56, 100, 52, 0.9) 100%)',
    color: '#f8fff8',
    border: '1px solid rgba(76, 120, 72, 0.5)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    boxShadow: '0 8px 18px rgba(76, 120, 72, 0.25)',
    fontFamily: 'Cormorant Garamond, serif',
  },
  restartButton: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 100%)',
    color: '#3d2914',
    border: '1px solid rgba(184, 134, 11, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    boxShadow: '0 6px 15px rgba(61, 41, 20, 0.15)',
    fontFamily: 'Cormorant Garamond, serif',
  },
};
