// backend/routes/jamSession.js
const express = require('express');
const router = express.Router();

// In-memory storage for jam sessions (use Redis in production)
const sessions = new Map();

class JamSession {
  constructor(id, hostId, hostName) {
    this.id = id;
    this.hostId = hostId;
    this.hostSocketId = null; // Track current host socket for realtime controls
    this.hostName = hostName;
    this.participants = new Map(); // socketId -> { id, name, joinedAt }
    this.queue = []; // Array of { song, addedBy, votes: Map(userId -> 1/-1), timestamp }
    this.currentSong = null;
    this.playbackState = {
      isPlaying: false,
      currentTime: 0,
      lastUpdateTime: Date.now()
    };
    this.settings = {
      allowVoting: true,
      maxQueueSize: 50,
      autoPlay: true,
      skipThreshold: 0.5 // 50% of users need to vote skip
    };
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.history = []; // Recently played songs
  }

  addParticipant(socketId, userId, userName) {
    this.participants.set(socketId, {
      id: userId,
      name: userName,
      joinedAt: Date.now()
    });
    this.lastActivity = Date.now();
  }

  removeParticipant(socketId) {
    this.participants.delete(socketId);
    this.lastActivity = Date.now();
    // If host leaves, assign new host
    if (this.hostSocketId === socketId && this.participants.size > 0) {
      const newHost = Array.from(this.participants.entries())[0];
      // Promote first remaining participant as host
      this.hostSocketId = newHost[0];
      this.hostId = newHost[1].id; // preserve userId
      this.hostName = newHost[1].name;
      return { newHost: true, hostId: this.hostId };
    }
    return { newHost: false };
  }

  addToQueue(song, addedBy, userId) {
    if (this.queue.length >= this.settings.maxQueueSize) {
      return { success: false, error: 'Queue is full' };
    }

    const queueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      song: song,
      addedBy: addedBy,
      userId: userId,
      votes: new Map(),
      timestamp: Date.now(),
      score: 0
    };

    this.queue.push(queueItem);
    this.sortQueue();
    this.lastActivity = Date.now();
    
    return { success: true, queueItem };
  }

  vote(queueItemId, userId, voteValue) {
    const item = this.queue.find(q => q.id === queueItemId);
    if (!item) {
      return { success: false, error: 'Song not found in queue' };
    }

    // Remove previous vote if exists
    if (item.votes.has(userId)) {
      const oldVote = item.votes.get(userId);
      item.score -= oldVote;
    }

    // Add new vote
    if (voteValue === 0) {
      item.votes.delete(userId);
    } else {
      item.votes.set(userId, voteValue);
      item.score += voteValue;
    }

    this.sortQueue();
    this.lastActivity = Date.now();
    
    return { success: true, item };
  }

  sortQueue() {
    // Sort by score (descending), then by timestamp (ascending)
    this.queue.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timestamp - b.timestamp;
    });
  }

  removeFromQueue(queueItemId, userId) {
    const index = this.queue.findIndex(q => q.id === queueItemId);
    if (index === -1) {
      return { success: false, error: 'Song not found in queue' };
    }

    const item = this.queue[index];
    // Only the person who added it or the host can remove
    if (item.userId !== userId && this.hostId !== userId) {
      return { success: false, error: 'Permission denied' };
    }

    this.queue.splice(index, 1);
    this.lastActivity = Date.now();
    
    return { success: true };
  }

  playNext() {
    if (this.currentSong) {
      this.history.unshift(this.currentSong);
      if (this.history.length > 20) {
        this.history = this.history.slice(0, 20);
      }
    }

    if (this.queue.length > 0) {
      this.currentSong = this.queue.shift();
      this.playbackState = {
        isPlaying: true,
        currentTime: 0,
        lastUpdateTime: Date.now()
      };
      this.lastActivity = Date.now();
      return { success: true, song: this.currentSong };
    }

    this.currentSong = null;
    this.playbackState.isPlaying = false;
    return { success: false, error: 'Queue is empty' };
  }

  updatePlaybackState(state) {
    this.playbackState = {
      ...this.playbackState,
      ...state,
      lastUpdateTime: Date.now()
    };
    this.lastActivity = Date.now();
  }

  getState() {
    return {
      id: this.id,
      hostId: this.hostId,
      hostSocketId: this.hostSocketId,
      hostName: this.hostName,
      participants: Array.from(this.participants.values()),
      participantCount: this.participants.size,
      queue: this.queue.map(item => ({
        ...item,
        votes: Object.fromEntries(item.votes),
        voteCount: item.votes.size
      })),
      currentSong: this.currentSong,
      playbackState: this.playbackState,
      settings: this.settings,
      history: this.history.slice(0, 5)
    };
  }

  // AI-powered recommendation based on session activity
  getRecommendations(allSongs) {
    const genreFrequency = new Map();
    const artistFrequency = new Map();
    
    // Analyze queue and history
    [...this.queue, ...this.history].forEach(item => {
      const song = item.song || item;
      if (song.genre) {
        genreFrequency.set(song.genre, (genreFrequency.get(song.genre) || 0) + 1);
      }
      if (song.artist) {
        artistFrequency.set(song.artist, (artistFrequency.get(song.artist) || 0) + 1);
      }
    });

    // Score songs based on matching preferences
    const recommendations = allSongs
      .filter(song => {
        // Don't recommend songs already in queue or recently played
        const inQueue = this.queue.some(q => q.song.id === song.id);
        const inHistory = this.history.some(h => (h.song?.id || h.id) === song.id);
        const isCurrent = this.currentSong && (this.currentSong.song?.id || this.currentSong.id) === song.id;
        return !inQueue && !inHistory && !isCurrent;
      })
      .map(song => {
        let score = 0;
        
        // Genre match
        if (song.genre && genreFrequency.has(song.genre)) {
          score += genreFrequency.get(song.genre) * 3;
        }
        
        // Artist match
        if (song.artist && artistFrequency.has(song.artist)) {
          score += artistFrequency.get(song.artist) * 2;
        }
        
        // Add randomness for diversity
        score += Math.random() * 2;
        
        return { song, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.song);

    return recommendations;
  }
}

// Generate unique session code
function generateSessionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// REST API endpoints
router.post('/create', (req, res) => {
  const { hostName } = req.body;
  const sessionCode = generateSessionCode();
  const hostId = `host-${Date.now()}`;
  
  const session = new JamSession(sessionCode, hostId, hostName || 'Host');
  sessions.set(sessionCode, session);
  
  res.json({
    success: true,
    sessionCode,
    hostId,
    session: session.getState()
  });
});

router.get('/session/:code', (req, res) => {
  const { code } = req.params;
  const session = sessions.get(code.toUpperCase());
  
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  
  res.json({
    success: true,
    session: session.getState()
  });
});

router.get('/active-sessions', (req, res) => {
  const activeSessions = Array.from(sessions.entries())
    .filter(([_, session]) => session.participants.size > 0 || Date.now() - session.lastActivity < 300000) // Active in last 5 min
    .map(([code, session]) => ({
      code,
      hostName: session.hostName,
      participantCount: session.participants.size,
      queueSize: session.queue.length,
      createdAt: session.createdAt
    }));
  
  res.json({
    success: true,
    sessions: activeSessions
  });
});

// Socket.IO event handlers (called from server.js)
function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join session
    socket.on('join-session', ({ sessionCode, userName, userId }) => {
      const session = sessions.get(sessionCode.toUpperCase());
      
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      socket.join(sessionCode);
      const finalUserId = userId || socket.id;
      session.addParticipant(socket.id, finalUserId, userName || 'Anonymous');
      // If no host assigned yet, set this socket as host controller
      if (!session.hostSocketId) {
        session.hostSocketId = socket.id;
      }
      
      socket.emit('session-joined', {
        session: session.getState(),
        userId: finalUserId
      });
      
      io.to(sessionCode).emit('participant-joined', {
        participant: { id: finalUserId, name: userName || 'Anonymous' },
        participantCount: session.participants.size
      });
      
      socket.sessionCode = sessionCode;
      socket.userId = finalUserId;
    });

    // Leave session
    socket.on('leave-session', () => {
      if (socket.sessionCode) {
        const session = sessions.get(socket.sessionCode);
        if (session) {
          const result = session.removeParticipant(socket.id);
          
          io.to(socket.sessionCode).emit('participant-left', {
            userId: socket.userId,
            participantCount: session.participants.size,
            newHost: result.newHost,
            hostId: result.hostId
          });

          // Clean up empty sessions
          if (session.participants.size === 0) {
            setTimeout(() => {
              const sess = sessions.get(socket.sessionCode);
              if (sess && sess.participants.size === 0) {
                sessions.delete(socket.sessionCode);
                console.log('Deleted empty session:', socket.sessionCode);
              }
            }, 60000); // Delete after 1 minute if still empty
          }
        }
        socket.leave(socket.sessionCode);
      }
    });

    // Add song to queue
    socket.on('add-to-queue', ({ song }) => {
      if (!socket.sessionCode) return;
      
      const session = sessions.get(socket.sessionCode);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      const participant = session.participants.get(socket.id);
      const result = session.addToQueue(song, participant?.name || 'Anonymous', socket.userId);
      
      if (result.success) {
        io.to(socket.sessionCode).emit('queue-updated', {
          queue: session.queue.map(item => ({
            ...item,
            votes: Object.fromEntries(item.votes),
            voteCount: item.votes.size
          }))
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    });

    // Vote on queue item
    socket.on('vote', ({ queueItemId, voteValue }) => {
      if (!socket.sessionCode) return;
      
      const session = sessions.get(socket.sessionCode);
      if (!session || !session.settings.allowVoting) return;

      const result = session.vote(queueItemId, socket.userId, voteValue);
      
      if (result.success) {
        io.to(socket.sessionCode).emit('queue-updated', {
          queue: session.queue.map(item => ({
            ...item,
            votes: Object.fromEntries(item.votes),
            voteCount: item.votes.size
          }))
        });
      }
    });

    // Remove from queue
    socket.on('remove-from-queue', ({ queueItemId }) => {
      if (!socket.sessionCode) return;
      
      const session = sessions.get(socket.sessionCode);
      if (!session) return;

      const result = session.removeFromQueue(queueItemId, socket.userId);
      
      if (result.success) {
        io.to(socket.sessionCode).emit('queue-updated', {
          queue: session.queue.map(item => ({
            ...item,
            votes: Object.fromEntries(item.votes),
            voteCount: item.votes.size
          }))
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    });

    // Play next song
    socket.on('play-next', () => {
      console.log('⏭️ play-next event received from:', socket.id);
      if (!socket.sessionCode) {
        console.log('❌ No session code');
        return;
      }
      
      const session = sessions.get(socket.sessionCode);
      if (!session) {
        console.log('❌ Session not found');
        return;
      }

      const result = session.playNext();
      console.log('▶️ playNext result:', result);
      
      if (result.success) {
        const eventData = {
          song: result.song,
          queue: session.queue.map(item => ({
            ...item,
            votes: Object.fromEntries(item.votes),
            voteCount: item.votes.size
          }))
        };
        console.log('📡 Broadcasting now-playing to room:', socket.sessionCode);
        io.to(socket.sessionCode).emit('now-playing', eventData);
      } else {
        console.log('❌ playNext failed:', result.error);
      }
    });

    // Sync playback state
    socket.on('playback-update', (state) => {
      if (!socket.sessionCode) return;
      
      const session = sessions.get(socket.sessionCode);
      // Only the current host socket can control playback
      if (!session || socket.id !== session.hostSocketId) return;

      console.log('🔄 Playback update from host:', state);
      session.updatePlaybackState(state);
      
      // Broadcast to OTHER participants only (exclude the host)
      socket.to(socket.sessionCode).emit('playback-sync', state);
      console.log('📡 Broadcasted playback-sync to room:', socket.sessionCode);
    });

    // Get AI recommendations
    socket.on('get-recommendations', ({ allSongs }) => {
      if (!socket.sessionCode) return;
      
      const session = sessions.get(socket.sessionCode);
      if (!session) return;

      const recommendations = session.getRecommendations(allSongs);
      socket.emit('recommendations', { songs: recommendations });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      if (socket.sessionCode) {
        const session = sessions.get(socket.sessionCode);
        if (session) {
          const result = session.removeParticipant(socket.id);
          
          io.to(socket.sessionCode).emit('participant-left', {
            userId: socket.userId,
            participantCount: session.participants.size,
            newHost: result.newHost,
            hostId: result.hostId
          });

          // Clean up empty sessions
          if (session.participants.size === 0) {
            setTimeout(() => {
              const sess = sessions.get(socket.sessionCode);
              if (sess && sess.participants.size === 0) {
                sessions.delete(socket.sessionCode);
                console.log('Deleted empty session:', socket.sessionCode);
              }
            }, 60000);
          }
        }
      }
    });
  });
}

// Periodic cleanup of stale sessions
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 30 * 60 * 1000; // 30 minutes
  
  for (const [code, session] of sessions.entries()) {
    if (session.participants.size === 0 && now - session.lastActivity > staleThreshold) {
      sessions.delete(code);
      console.log('Cleaned up stale session:', code);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

module.exports = { router, setupSocketHandlers };
