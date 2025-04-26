import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
	plugins: [svelte()],
	server: {
		port: parseInt(process.env.PORT || '3001'),
		host: true
	}
}); 