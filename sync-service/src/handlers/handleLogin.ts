import logger from '../logger';
import { MyWebSocket, PB_URL } from '../server';

async function checkLogin(user: string, token: string): Promise<boolean> {
	// return true;
	var myHeaders = new Headers();
	myHeaders.append('Authorization', token);
	// myHeaders.append('Referer', 'http://coachng.j0nas.xyz/api/collections/users/records/' + user);

	const url = `${
		PB_URL?.endsWith('/') ? PB_URL.slice(0, PB_URL.length - 1) : PB_URL
	}/api/collections/users/records/${user}`;
	const response = await fetch(url, {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow'
	});
	logger.debug(JSON.stringify(response));
	if (response.status == 200) {
		logger.debug('is valid!');
		return true;
	} else {
		logger.warn(`L1 PocketBase returned status ${response.status}: ${response.statusText}`);
		return false;
	}
}

export default function handleLogin(client: MyWebSocket, data: { [key: string]: any }) {
	if (client.isAuthorized) {
		logger.debug(`Client is already authorized.`);
		client.send(JSON.stringify({ type: 'login', msg: 'Login OK' }));
		return;
	}
	const url = `${PB_URL?.endsWith('/') ? PB_URL.slice(0, PB_URL.length - 1) : PB_URL}/api/collections/users/records/${
		data.userId
	}`;
	logger.debug(`Calling ${url} with user-token`);

	checkLogin(data.userId, data.token)
		.then(success => {
			if (success) {
				client.send(JSON.stringify({ type: 'login', msg: 'Login OK' }));
				client.isAuthorized = true;
				client.userId = data.userId;
				logger.debug('Client authorized');
			} else {
				client.send(JSON.stringify({ type: 'error', msg: 'Unauthorized (L1)' })); // ERROR L1
				client.close(3000);
			}
		})
		.catch(e => {
			logger.error(`L2 ${e}`);
			logger.error(e.stack);
			client.send(JSON.stringify({ type: 'error', msg: 'Unauthorized (L2)' })); // ERROR L2
			client.close(3000);
		});
}
