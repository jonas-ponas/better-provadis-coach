import pocketbaseEs from 'pocketbase';
import {MyWebSocket} from '../websocket';
const PocketBase = require('pocketbase/cjs');

export default function handleLogin(client: MyWebSocket, data: {[key: string]: any}) {
    if(client.isAuthorized) {
        client.send(JSON.stringify({type: 'login', msg: 'Login OK'}));
    }
	fetch(`https://coach.***REMOVED***/api/collections/users/records/${data.userId}`, {
		method: 'GET',
		headers: {
			Authorization: data.token
		}
	}).then(async (response) => {
		if (response.status == 200) {
			client.send(JSON.stringify({type: 'login', status: 200, msg: 'Login OK'}));
            client.isAuthorized = true;
            client.userId = data.userId
		} else {
            client.send(JSON.stringify({type: 'error', msg: 'Login FAIL'}))
            client.close(3000)
        }
	}).catch(e => {
        console.error(e)
        client.send(JSON.stringify({type: 'error', msg: 'Login FAIL'}))
        client.close(3000)
    })
}
