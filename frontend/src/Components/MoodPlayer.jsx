import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * MoodPlayer Component
 * Provides camera access, emotion detection, and mood-based song playback
 */
export default function MoodPlayer({ onSongSelect, onClose }) {
  const [isOpen, setIsOpen] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detectedMood, setDetectedMood] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Click "Start Camera" to begin');
  const [countdown, setCountdown] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Emotion API endpoint
  const EMOTION_API = 'http://localhost:5001/api/detect-mood';
  const MOOD_PLAY_API = 'http://localhost:4000/api/mood-play';

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setStatusMessage('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setCameraActive(true);
      setStatusMessage('Camera ready! Click "Detect My Mood" when ready.');
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? 'Camera access denied. Please allow camera permission and try again.'
          : 'Failed to access camera. Please ensure a camera is connected.'
      );
      setStatusMessage('Camera error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Flip horizontally for selfie view
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    
    // Get base64 encoded JPEG
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const detectMood = async () => {
    if (!cameraActive) {
      setStatusMessage('Please start the camera first');
      return;
    }

    // Countdown before capture
    setDetecting(true);
    setStatusMessage('Get ready...');
    
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(null);
    setStatusMessage('Capturing...');

    try {
      // Capture frame from video
      const imageData = captureFrame();
      
      if (!imageData) {
        throw new Error('Failed to capture image from camera');
      }

      setStatusMessage('Analyzing your mood...');

      // Send to emotion detection API
      const emotionResponse = await fetch(EMOTION_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      const emotionResult = await emotionResponse.json();

      if (emotionResult.error || !emotionResult.mood) {
        throw new Error(emotionResult.error || 'Could not detect mood');
      }

      setDetectedMood(emotionResult.mood);
      setConfidence(emotionResult.confidence);
      setStatusMessage(`Detected: ${emotionResult.mood.toUpperCase()} (${Math.round(emotionResult.confidence * 100)}% confidence)`);

      // Get song recommendation based on mood
      setStatusMessage(`Finding a ${emotionResult.mood} song for you...`);
      
      const songResponse = await fetch(MOOD_PLAY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mood: emotionResult.mood }),
      });

      const songResult = await songResponse.json();

      if (songResult.error || !songResult.song) {
        throw new Error(songResult.error || 'No song found');
      }

      setStatusMessage(`Playing: ${songResult.song.title} by ${songResult.song.artist}`);
      
      // Stop camera and trigger song playback
      stopCamera();
      
      if (onSongSelect) {
        onSongSelect(songResult.song);
      }

    } catch (err) {
      console.error('Mood detection error:', err);
      setStatusMessage(`Error: ${err.message}. Try again.`);
      setDetectedMood(null);
      setConfidence(null);
    } finally {
      setDetecting(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
    if (onClose) onClose();
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprise: '😲',
      fear: '😨',
      disgust: '🤢',
      neutral: '😐'
    };
    return emojis[mood] || '🎵';
  };

  if (!isOpen) return null;

  return (
    <div className="mood-player-overlay" style={styles.overlay}>
      <div className="mood-player-modal" style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>🎭 Music from Mood</h2>
          <button onClick={handleClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.content}>
          {/* Camera Preview */}
          <div style={styles.videoContainer}>
            <video 
              ref={videoRef} 
              style={{
                ...styles.video,
                display: cameraActive ? 'block' : 'none',
                transform: 'scaleX(-1)'  // Mirror for selfie view
              }}
              playsInline
              muted
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {!cameraActive && (
              <div style={styles.placeholder}>
                <span style={{ fontSize: '4rem' }}>📷</span>
                <p>Camera preview will appear here</p>
              </div>
            )}

            {countdown && (
              <div style={styles.countdown}>
                {countdown}
              </div>
            )}

            {detectedMood && !detecting && (
              <div style={styles.moodBadge}>
                {getMoodEmoji(detectedMood)} {detectedMood.toUpperCase()}
                {confidence && <span style={styles.confidence}>{Math.round(confidence * 100)}%</span>}
              </div>
            )}
          </div>

          {/* Error Display */}
          {cameraError && (
            <div style={styles.error}>
              ⚠️ {cameraError}
            </div>
          )}

          {/* Status Message */}
          <div style={styles.status}>
            {statusMessage}
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            {!cameraActive ? (
              <button 
                onClick={startCamera} 
                style={styles.primaryBtn}
                disabled={detecting}
              >
                📷 Start Camera
              </button>
            ) : (
              <>
                <button 
                  onClick={detectMood} 
                  style={styles.primaryBtn}
                  disabled={detecting}
                >
                  {detecting ? '⏳ Detecting...' : '🔍 Detect My Mood'}
                </button>
                <button 
                  onClick={stopCamera} 
                  style={styles.secondaryBtn}
                  disabled={detecting}
                >
                  Stop Camera
                </button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div style={styles.instructions}>
            <p><strong>How it works:</strong></p>
            <ol style={{ textAlign: 'left', margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Click "Start Camera" and allow camera access</li>
              <li>Position your face in the frame</li>
              <li>Click "Detect My Mood" - hold your expression!</li>
              <li>A song matching your mood will play automatically</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#fff'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '2rem',
    cursor: 'pointer',
    padding: '0',
    lineHeight: 1,
    opacity: 0.7,
    transition: 'opacity 0.2s'
  },
  content: {
    padding: '1.5rem'
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4/3',
    backgroundColor: '#0d0d1a',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '1rem'
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.5)'
  },
  countdown: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '6rem',
    fontWeight: 'bold',
    color: '#fff',
    textShadow: '0 0 20px rgba(0, 0, 0, 0.8)'
  },
  moodBadge: {
    position: 'absolute',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  confidence: {
    fontSize: '0.9rem',
    opacity: 0.8
  },
  error: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    color: '#ff3b30',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    textAlign: 'center'
  },
  status: {
    textAlign: 'center',
    color: '#fff',
    marginBottom: '1rem',
    fontSize: '1rem',
    minHeight: '1.5em'
  },
  controls: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  instructions: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '1rem',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '0.9rem'
  }
};
