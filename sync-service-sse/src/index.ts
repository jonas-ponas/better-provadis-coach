import express, { Response } from 'express';
import logger from './logger';
import { config } from 'dotenv';
import { checkPocketbaseToken, getLoggedInClient } from './util';
import { syncFiles } from './sync';

config();

export const ENV = {
	PB_USER: process.env.PB_USER ?? '',
	PB_PASSWD: process.env.PB_PASSWD ?? '',
	PB_URL: process.env.PB_URL ?? '',
	CLIENT_ID: process.env.CLIENT_ID ?? '',
	CLIENT_SECRET: process.env.CLIENT_SECRET ?? ''
};

if ([ENV.PB_USER, ENV.PB_PASSWD, ENV.PB_URL, ENV.CLIENT_ID, ENV.CLIENT_SECRET].some(v => v === '')) {
	logger.error('PocketBase Service User Credentials Missing. Check Environment Variables!');
	process.exit(1);
}

const app = express();

app.use((request, response, next) => {
	const proxiedIp = request.headers['X-Real-IP'];
	if (proxiedIp) logger.verbose(`[HTTP] ${proxiedIp ?? request.ip} ${request.method} ${request.path}`);
	next();
});

let clients: { id: number; response: Response }[] = [];

const PORT = process.env.PORT ?? 8080;

app.get('/sync/:userId', async (req, resp, next) => {
	const authorization = req.header('authorization');
	const userId = req.params.userId;

	if (!authorization || !userId) {
		logger.debug('Bad Request');
		resp.status(400).send('Bad Request');
		return next();
	}
	// logger.warn('SKIPPING AUTH!');
	const isTokenValid = await checkPocketbaseToken(req.params.userId, authorization);
	if (!isTokenValid) {
		logger.debug('Unauthorized');
		resp.status(401).send('Unauthorized');
		return next();
	}

	const client = await getLoggedInClient();
	if (!client.authStore.isValid) {
		logger.debug('Internal Server Error');
		resp.status(500).send('Internal Server Error');
		return next();
	}

	const headers = {
		'Content-Type': 'text/event-stream',
		Connection: 'keep-alive',
		'Cache-Control': 'no-cache'
	};
	resp.writeHead(200, headers);

	await syncFiles({
		client,
		userId,
		onProgress(message) {
			// logger.verbose(`Sending: ${JSON.stringify(message)}`);
			resp.write(`data: ${JSON.stringify(message)}\n\n`);
		}
	});

	req.on('close', () => {
		logger.info('Client disconnected');
	});
});

app.listen(PORT, () => {
	logger.info(`Sync Service SSE service listening at Port ${PORT}`);
});
