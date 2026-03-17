// Use environment variable for API URL — falls back to localhost for dev
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7001';
