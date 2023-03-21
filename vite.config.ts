import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
	return defineConfig({
		plugins: [react()],
		server: {
			proxy: {
				'^/api': {
					target: 'https://dev.coach.jo-nas.cloud',
					changeOrigin: true
				},
				'/ws': {
					target: 'wss://dev.coach.jo-nas.cloud',
					ws: true,
					changeOrigin: true
				}
			}
		}
	});
};
