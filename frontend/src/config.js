// API Configuration
// This file provides the base URL for API calls

// Check if we're in production (Vercel sets this, or check hostname)
const isProd = import.meta.env.PROD || 
               (typeof window !== 'undefined' && 
                !window.location.hostname.includes('localhost') && 
                !window.location.hostname.includes('127.0.0.1'));

// Backend URL - always use Render URL in production
export const API_BASE_URL = isProd 
  ? 'https://music-player-pro.onrender.com'
  : '';  // Empty string for dev (uses Vite proxy)

export const SOCKET_URL = isProd
  ? 'https://music-player-pro.onrender.com'
  : 'http://localhost:4000';

// Debug: log the config on load
if (typeof window !== 'undefined') {
  console.log('🔧 Config loaded - isProd:', isProd, 'API_BASE_URL:', API_BASE_URL);
}

export const getApiUrl = (path) => `${API_BASE_URL}${path}`;
export const getMediaUrl = (path) => `${API_BASE_URL}/media/${path}`;
