import { WebSocketServer, WebSocket, RawData } from 'ws';
import handleLogin from './handlers/handleLogin';
import handleSync from './handlers/handleSync';
import dotenv from 'dotenv';
import logger from './logger';
import { scheduled } from './scheduled';
import { CronJob } from 'cron';
import handleSyncNews from './handlers/handleSyncNews';

dotenv.config();

export const PB_USER = process.env.PB_USER;
export const PB_PASSWD = process.env.PB_PASSWD;
export const PB_URL = process.env.PB_URL;
export const UNSUPPORTED_FILES = (process.env.UNSUPPORTED_FILES ?? '').split(',');

if (!PB_PASSWD || !PB_USER || !PB_URL) {
	logger.error('PocketBase Service User Credentials Missing. Check Environment Variables!');
	process.exit(1);
}

const PORT = parseInt(process.env.PORT || '8080');

logger.debug({
	UNSUPPORTED_FILES,
	PB_URL,
	PORT
});

const wss = new WebSocketServer({
	port: PORT
});

type Handler = (client: MyWebSocket, data: { [key: string]: any }) => void;

export interface MyWebSocketMessage {
	type: 'login' | 'sync' | 'error' | 'progress';
	phase?: string;
	step?: number;
	detail?: number;
	total?: number;
	msg?: string;
}

export interface MyWebSocket extends WebSocket {
	remoteAdress: string;
	isAuthorized: boolean;
	userId: any;
}

const handlers: { [key: string]: Handler } = {
	sync: handleSync,
	syncNews: handleSyncNews,
	login: handleLogin
};

function handleMessage(client: MyWebSocket) {
	return function (data: RawData, isBinary: boolean) {
		let json;
		try {
			json = JSON.parse(data.toString('utf8'));
			if (json.type && Object.keys(handlers).includes(json.type)) {
				logger.verbose('Incoming ' + JSON.stringify(json));
				return handlers[json.type](client, json);
			}
			return client.send(JSON.stringify({ type: 'error', msg: 'Unknown message type.' }));
		} catch (e) {
			logger.warn('Unsupported Data: ' + data.toString('utf-8'));
			client.close(1003, 'Unsupported Data');
			client.send(JSON.stringify({ type: 'error', msg: 'Provide JSON.' }));
			return;
		}
	};
}

wss.on('listening', () => {
	logger.info(`Websocket listening running on port ${PORT}`);
});

wss.on('connection', (client: MyWebSocket, request) => {
	client.isAuthorized = false;
	client.remoteAdress = request.socket.remoteAddress || 'none';
	logger.debug(`X-Real-IP: ${request.headers['x-real-ip']} remoteAddress: ${request.socket.remoteAddress}`);
	if (request.headers['x-real-ip']) client.remoteAdress = request.headers['x-real-ip'] as string;

	logger.info(`Client ${client.remoteAdress} connected`);

	setTimeout(() => {
		if (!client.isAuthorized && client.readyState == client.OPEN) {
			logger.log('info', `Client ${client.remoteAdress} did not authorize in time`);
			client.close(3000, 'Login Timeout');
		}
	}, 10 * 1000);

	client.on('message', handleMessage(client));

	client.on('close', () => {
		logger.info(`Client ${client.remoteAdress} disconnected`);
	});
});

wss.on('error', (error: Error) => {
	logger.error(error);
	logger.error(error.stack);
});

// At 07:00 AM, 10:00 AM, 01:00 PM, 04:00 PM and 07:00 PM, Monday through Friday
// via https://crontab.cronhub.io/
const cronString = process.env.CRON ?? '0 7,13,16,19 * * 1-5';
logger.info(`Scheduling Sync with cron: ${cronString}`);
const job = new CronJob(
	cronString,
	() => {
		if (!PB_PASSWD || !PB_USER || !PB_URL) {
			logger.error('PocketBase Service User Credentials Missing. Check Environment Variables!');
			return;
		}
		scheduled({
			pocketbase: {
				url: PB_URL,
				user: PB_USER,
				password: PB_PASSWD
			},
			lastSyncDiff: 1000 * 60 * 60 // If theres a sync newer than 1 hour. dont sync
		});
	},
	() => {
		logger.info('CronJob completed!');
	},
	true,
	'Europe/Berlin'
);
