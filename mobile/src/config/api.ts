export const API_BASE_URL = 'http://localhost:3001';

export const API_ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/upload`,
  ANALYZE: (scriptId: string) => `${API_BASE_URL}/analyze/${scriptId}`,
  // ... existing endpoints ...
}; 