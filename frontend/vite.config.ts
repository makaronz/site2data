import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dns from 'node:dns';

// Wymuszenie IPv4
dns.setDefaultResultOrder('verbatim');

export default defineConfig({
	plugins: [react()],
	server: {
		host: '0.0.0.0',
		port: 3002,
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:3001',
				changeOrigin: true,
				secure: false,
				ws: true,
				rewrite: (path) => path.replace(/^\/api/, '')
			},
			'/ws': {
				target: 'ws://localhost:3001',
				ws: true,
				changeOrigin: true
			}
		},
		hmr: {
			protocol: 'ws',
			host: 'localhost',
			port: 3002
		}
	}
}); 