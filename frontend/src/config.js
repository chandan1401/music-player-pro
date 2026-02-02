// API Configuration
// This file provides the base URL for API calls
// In development, we use relative URLs (proxied by Vite)
// In production, we use the deployed backend URL

const isProd = import.meta.env.PROD;

// IMPORTANT: Update this URL after deploying your backend to Render
export const API_BASE_URL = isProd 
  ? 'https://music-player-backend-xw9r.onrender.com'  // Will be updated after Render deployment
  : '';  // Empty string for dev (uses Vite proxy)

export const SOCKET_URL = isProd
  ? 'https://music-player-backend-xw9r.onrender.com'
  : 'http://localhost:4000';

export const getApiUrl = (path) => `${API_BASE_URL}${path}`;
export const getMediaUrl = (path) => `${API_BASE_URL}/media/${path}`;
