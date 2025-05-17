interface Config {
  apiUrl: string;
  wsUrl: string;
}

function getWsUrlFromApiUrl(apiUrl: string): string {
  try {
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws/script-analysis`;
  } catch (error) {
    console.error('Error parsing API URL:', error);
    // Fallback to default
    return 'ws://localhost:5001/ws/script-analysis';
  }
}

// Use environment variables or default values
const config: Config = {
  apiUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001',
  wsUrl: process.env.REACT_APP_WS_URL || getWsUrlFromApiUrl(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'),
};

export default config;
