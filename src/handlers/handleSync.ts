import {createHash} from 'crypto';
import pocketbaseEs, {Record} from 'pocketbase';
import {Coach} from '../coach/Coach';
import logger from '../logger';
import coachToPocketbase from '../pocketbase/coachToPocketbase';
import {MyWebSocket, PB_PASSWD, PB_USER, PB_URL} from '../server';
import {sync} from '../sync';

export default function handleSync(client: MyWebSocket, data: {[key: string]: any}) {
	if (!client.isAuthorized || !client.userId) {
		logger.warn(`Client not authorized`);
		client.send(JSON.stringify({type: 'error', msg: 'Unauthorized'}));
		return;
	}
	if (!PB_USER || !PB_PASSWD || !PB_URL) {
		logger.error(`S1 PocketBase Service User/Url not specified!`);
		client.send(JSON.stringify({type: 'error', msg: 'Internal Error (S1)'})); // ERROR S1
		client.close(1011, 'Internal Error');
		return;
	}
	sync({
		onProgress(message) {
			client.send(JSON.stringify(message));
		},
		onClose(code) {
			client.close(code);
		},
		pocketbase: {
			url: PB_URL,
			user: PB_USER,
			password: PB_PASSWD
		},
		userId: client.userId
	});
}
