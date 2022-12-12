import pocketbaseEs from 'pocketbase';
import logger from '../logger';
import {MyWebSocket} from '../server';
const PocketBase = require('pocketbase/cjs');

export default function handleLogin(client: MyWebSocket, data: {[key: string]: any}) {
    if(client.isAuthorized) {
        logger.log('debug', `Client is already authorized.`)
        client.send(JSON.stringify({type: 'login', msg: 'Login OK'}));
        return
    }
	fetch(`https://coach.***REMOVED***/api/collections/users/records/${data.userId}`, {
		method: 'GET',
		headers: {
			Authorization: data.token
		}
	}).then(async (response) => {
		if (response.status == 200) {
			client.send(JSON.stringify({type: 'login',  msg: 'Login OK'}));
            client.isAuthorized = true;
            client.userId = data.userId
            logger.log('debug', 'Client authorized')
		} else {
            logger.log('warn', `L1 PocketBase returned status ${response.status}: ${response.statusText}`)
            client.send(JSON.stringify({type: 'error', msg: 'Unauthorized (L1)'})) // ERROR L1
            client.close(3000)
        }
	}).catch(e => {
        logger.log('error', `L2 ${e}`)
        client.send(JSON.stringify({type: 'error', msg: 'Unauthorized (L2)'})) // ERROR L2
        client.close(3000)
    })
}
