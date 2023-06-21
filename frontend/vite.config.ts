import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
	const myEnv = { ...process.env, ...loadEnv(mode, process.cwd()) };
	console.log(myEnv.VITE_POCKETBASE);
	return defineConfig({
		plugins: [react()],
		server: {
			proxy: {
				'^/api': {
					target: `${myEnv.VITE_POCKETBASE}`,
					changeOrigin: true
				},
				'/ws': {
					target: `${myEnv.VITE_SYNC}`,
					ws: true,
					changeOrigin: true
				},
				'/ical': {
					target: `${myEnv.VITE_ICAL}`,
					changeOrigin: true
				}
			}
		}
	});
};
