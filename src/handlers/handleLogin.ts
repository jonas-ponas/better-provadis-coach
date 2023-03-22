import logger from '../logger';
import {MyWebSocket, PB_URL} from '../server';

export default function handleLogin(client: MyWebSocket, data: {[key: string]: any}) {
	if (client.isAuthorized) {
		logger.debug(`Client is already authorized.`);
		client.send(JSON.stringify({type: 'login', msg: 'Login OK'}));
		return;
	}
	const url = `${PB_URL?.endsWith('/') ? PB_URL.slice(0, PB_URL.length - 1) : PB_URL}/api/collections/users/records/${
		data.userId
	}`;
	logger.debug(`Calling ${url} with user-token`);
	fetch(url, {
		method: 'GET',
		headers: {
			Authorization: data.token
		}
	})
		.then(async response => {
			if (response.status == 200) {
				client.send(JSON.stringify({type: 'login', msg: 'Login OK'}));
				client.isAuthorized = true;
				client.userId = data.userId;
				logger.debug('Client authorized');
			} else {
				logger.warn(`L1 PocketBase returned status ${response.status}: ${response.statusText}`);
				client.send(JSON.stringify({type: 'error', msg: 'Unauthorized (L1)'})); // ERROR L1
				client.close(3000);
			}
		})
		.catch(e => {
			logger.error(`L2 ${e}`);
			client.send(JSON.stringify({type: 'error', msg: 'Unauthorized (L2)'})); // ERROR L2
			client.close(3000);
		});
}
