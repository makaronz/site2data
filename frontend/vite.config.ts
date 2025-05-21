import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // Alias @site2data/schemas jest teraz obsługiwany przez vite-tsconfig-paths
      // na podstawie wpisów w tsconfig.json, więc możemy go tutaj usunąć lub zakomentować,
      // aby uniknąć potencjalnych konfliktów. Na razie zostawię zakomentowany.
      // '@site2data/schemas': path.resolve(__dirname, '../packages/schemas/src/index.ts'),
      '@/': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.VITE_FRONTEND_PORT || '5173'),
    proxy: {
      '/api': {
        target: process.env.VITE_API_GATEWAY_URL || 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/ws/script-analysis': {
        target: process.env.VITE_WEBSOCKET_URL || 'ws://localhost:3002',
        ws: true,
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: !!process.env.VITE_USE_POLLING,
    },
    host: true,
    strictPort: true,
  },
  build: {
    outDir: 'build',
  },
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled', '@mui/material/Tooltip'],
  },
}); 