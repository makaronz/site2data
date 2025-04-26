/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
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
				target: 'http://localhost:3001',
				changeOrigin: true,
				secure: false,
			},
			'/ws': {
				target: 'ws://localhost:3001',
				ws: true,
			}
		},
		hmr: {
			protocol: 'ws',
			host: 'localhost',
			port: 3002
		}
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		css: true,
		include: ['**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@components': path.resolve(__dirname, './src/components'),
			'@pages': path.resolve(__dirname, './src/pages'),
			'@hooks': path.resolve(__dirname, './src/hooks'),
			'@utils': path.resolve(__dirname, './src/utils'),
			'@types': path.resolve(__dirname, './src/types'),
			'@store': path.resolve(__dirname, './src/store'),
			'@assets': path.resolve(__dirname, './src/assets'),
		},
	},
	build: {
		outDir: 'dist',
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom', 'react-router-dom'],
					ui: ['@headlessui/react', '@heroicons/react'],
				},
			},
		},
	}
}); 