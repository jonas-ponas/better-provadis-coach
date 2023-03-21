import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
	return defineConfig({
		plugins: [react()],
		server: {
			proxy: {
				'^/api': {
					target: 'https://coach.***REMOVED***',
					changeOrigin: true
				},
				'/ws': {
					target: 'wss://coach.***REMOVED***',
					ws: true,
					changeOrigin: true
				}
			}
		}
	});
};
