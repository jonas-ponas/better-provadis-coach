import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
	return defineConfig({
		plugins: [react()],
		server: {
			proxy: {
				'^/api': {
					target: `https://${process.env.VITE_DEV_HOST}`,
					changeOrigin: true
				},
				'/ws': {
					target: `wss://${process.env.VITE_DEV_HOST}`,
					ws: true,
					changeOrigin: true
				}
			}
		}
	});
};
