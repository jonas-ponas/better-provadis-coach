import {createHash} from 'crypto';
import {Coach} from '../coach/Coach';
import logger from '../logger';
import coachToPocketbase from '../pocketbase/coachToPocketbase';
import {MyWebSocket, PB_PASSWD, PB_USER, PB_URL, MyWebSocketMessage} from '../server';
const Pocketbase = require('pocketbase/cjs');

export default async function handleSyncNews(client: MyWebSocket, data: {[key: string]: any}) {
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
	const onProgress = (obj: any) => client.send(JSON.stringify(obj));
	const onClose = (code: number) => client.close(code);

	const pb = new Pocketbase(PB_URL);
	try {
		await pb.admins.authWithPassword(PB_USER, PB_PASSWD);
	} catch (e: unknown) {
		logger.error(`S2 Could not authorize PocketBase Service User. Check Credentials! ${e}`);
		if (e instanceof Error) logger.error(e.stack);
		onProgress({type: 'error', msg: 'Internal Error (S2)'}); // ERROR S2
		onClose(1011);
		return;
	}
	let coach: Coach;
	let state;
	try {
		onProgress({type: 'progress', phase: 'state'});
		state = await pb.collection('state').getFirstListItem(`user.id = "${client.userId}"`);
		onProgress({type: 'progress', phase: 'coach', step: 1});
		coach = await Coach.createFromState(
			{
				token: state.token,
				expires: new Date(state.expires).getTime(),
				refreshToken: state.refreshToken,
				url: state.url,
				domainId: state.domainId,
				clientId: process.env.CLIENT_ID || '',
				clientSecret: process.env.CLIENT_SECRET || ''
			},
			logger
		);
		onProgress({type: 'progress', phase: 'coach', step: 2});
	} catch (e) {
		logger.error(`S4 Could not create Coach from state: ${e}`);
		if (e instanceof Error) logger.error(e.stack);
		onProgress({type: 'error', msg: 'Internal Error: Could not login into Provadis Coach (S4)'}); // ERROR S4
		onClose(1011);
		return;
	}
	let success = false;
	let username;
	let hash = '';
	try {
		const user = await coach.getUserInfo();
		onProgress({type: 'progress', phase: 'coach', step: 3});
		username = user.user.firstname + ' ' + user.user.familyname;
		logger.info(`Syncing News for: ${username}`);

		const news = await coach.getNews();
		hash = createHash('md5').update(JSON.stringify(news)).digest('hex');
		logger.verbose(`Current ${hash} === Remote ${state.lastNewsHash}`);
		if (hash != state.lastNewsHash) {
			await coachToPocketbase.insertNewsItems(news, pb, client.userId, (i, t) => {
				onProgress({type: 'progress', phase: 'database', step: 3, detail: i, total: t});
			});
		} else {
			logger.debug('Current News hash is equal to last one Skipping.');
		}
		success = true;
	} catch (e) {
		logger.error(`S3 Error occured while syncing: ${e}`);
		if (e instanceof Error) logger.error(e.stack);
		onProgress({type: 'error', msg: 'Internal Error (S3)'}); // ERROR S3
		onClose(1011);
	} finally {
		const currentState = coach.exportFromState();
		const data: any = {
			refreshToken: currentState.refreshToken,
			token: currentState.token,
			expires: new Date(currentState.expires || 0).toISOString(),
			url: currentState.url,
			coachUserId: currentState.userId,
			lastSync: success ? new Date().toISOString : state.lastSync,
			lastSyncSuccessful: success,
			coachUsername: username || state.coachUsername,
			lastNewsHash: hash
		};
		if (success) {
			data.lastSync = new Date().toISOString();
			logger.info(`Sync successfull. ${JSON.stringify(data)}`);
		} else {
			logger.info(`Sync not successfull!. ${JSON.stringify(data)}`);
		}

		try {
			await pb.collection('state').update(state.id, data);
		} catch (e: unknown) {
			logger.error(`Failed to write state back to pocketbase! ${e}`);
			if (e instanceof Error) logger.error(e.stack);
			onProgress({
				type: 'error',
				msg: 'Failed to write back token information. Consider reconnecting Coach via QR-Code'
			});
		}
		onProgress({type: 'progress', phase: 'done'});
	}
}
