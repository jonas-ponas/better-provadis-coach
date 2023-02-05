import {WebSocketServer, WebSocket, RawData} from 'ws';
import handleInit from './handlers/handleInit';
import handleLogin from './handlers/handleLogin';
import handleSync from './handlers/handleSync';
import dotenv from 'dotenv';
import logger from './logger';
import {scheduled} from './scheduled';
import cron from 'node-cron';

dotenv.config();

export const PB_USER = process.env.PB_USER;
export const PB_PASSWD = process.env.PB_PASSWD;
export const PB_URL = process.env.PB_URL;

if (!PB_PASSWD || !PB_USER || !PB_URL) {
	logger.error('PocketBase Service User Credentials Missing. Check Environment Variables!');
	process.exit(1);
}

const PORT = parseInt(process.env.PORT || '8080');

const wss = new WebSocketServer({
	port: PORT
});

type Handler = (client: MyWebSocket, data: {[key: string]: any}) => void;

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

const handlers: {[key: string]: Handler} = {
	init: handleInit,
	sync: handleSync,
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
			return client.send(JSON.stringify({type: 'error', msg: 'Unknown message type.'}));
		} catch (e) {
			logger.warn('Unsupported Data: ' + data.toString('utf-8'));
			client.close(1003, 'Unsupported Data');
			client.send(JSON.stringify({type: 'error', msg: 'Provide JSON.'}));
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
	logger.verbose(`Request-Headers: ${JSON.stringify(request.headers)}`);
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

// At 0 minutes past the hour, every 3 hours, between 07:00 AM and 07:59 PM, Monday through Friday
// via https://crontab.cronhub.io/
logger.info('Scheduling Sync with cron: 0 7-19/3 * * 1-5');
cron.schedule('0 7-19/3 * * 1-5', () => {
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
});
