import {createHash} from 'crypto';
import pocketbaseEs, {Record} from 'pocketbase';
import {Coach} from '../coach/Coach';
import logger from '../logger';
import coachToPocketbase from '../pocketbase/coachToPocketbase';
import {MyWebSocket, PB_PASSWD, PB_USER, PB_URL} from '../server';
const PocketBase = require('pocketbase/cjs');

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
	client.send(JSON.stringify({type: 'progress', phase: 'auth'}));
	const pb: pocketbaseEs = new PocketBase(PB_URL);
	pb.admins
		.authWithPassword(PB_USER, PB_PASSWD)
		.then(async value => {
			let coach: Coach;
			let state: Record;
			try {
				client.send(JSON.stringify({type: 'progress', phase: 'state'}));
				state = await pb.collection('state').getFirstListItem(`user.id = "${client.userId}"`);
				client.send(JSON.stringify({type: 'progress', phase: 'coach', step: 1}));
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
				client.send(JSON.stringify({type: 'progress', phase: 'coach', step: 2}));
			} catch (e) {
				client.send(JSON.stringify({type: 'error', msg: 'Internal Error (S4)'})); // ERROR S4
				logger.error('S4 Could not create Coach from state');
				logger.error(e);
				client.close(1011);
				return;
			}
			let success = false;
			let username;
			let hash = '';
			try {
				const user = await coach.getUserInfo();
				client.send(JSON.stringify({type: 'progress', phase: 'coach', step: 3}));
				username = user.user.firstname + ' ' + user.user.familyname;
				logger.info(`Syncing Files for: ${username}`);

				const dirs = await coach.getDirectories();
				// hash.dirs = createHash('md5').update(JSON.stringify(dirs)).digest('hex')
				client.send(JSON.stringify({type: 'progress', phase: 'coach', step: 4}));

				const files = await coach.getFiles();
				client.send(JSON.stringify({type: 'progress', phase: 'database', step: 1}));
				hash = createHash('md5').update(JSON.stringify(files)).digest('hex');

				if (hash !== state.lastFilesHash) {
					const ctoPb = await coachToPocketbase.insertDirectories(dirs, pb, state.user, new Map(), (i, t) => {
						client.send(
							JSON.stringify({type: 'progress', phase: 'database', step: 1, detail: i, total: t})
						);
					});
					client.send(JSON.stringify({type: 'progress', phase: 'database', step: 2}));
					const fToPb = await coachToPocketbase.insertFiles(files, pb, state.user, ctoPb, (i, t) => {
						client.send(
							JSON.stringify({type: 'progress', phase: 'database', step: 2, detail: i, total: t})
						);
					});
					client.send(JSON.stringify({type: 'progress', phase: 'database', step: 3}));
					await coachToPocketbase.insertCacheFiles(pb, coach, fToPb, (i, t) => {
						client.send(
							JSON.stringify({type: 'progress', phase: 'database', step: 3, detail: i, total: t})
						);
					});
				} else {
					logger.debug('Current File Hash is equal to last one. Skipping.');
				}
				success = true;
			} catch (e) {
				logger.warn('S3' + e);
				client.send(JSON.stringify({type: 'error', msg: 'Internal Error (S3)'})); // ERROR S3
				client.close(1011);
			} finally {
				const currentState = coach.exportFromState();
				const data: any = {
					refreshToken: currentState.refreshToken,
					token: currentState.token,
					expires: new Date(currentState.expires || 0).toISOString(),
					url: currentState.url,
					coachUserId: currentState.userId,
					lastSync: success ? new Date().toISOString : state.lastSync,
					coachUsername: username || state.coachUsername,
					lastFilesHash: hash
				};
				if (success) data.lastSync = new Date().toISOString();
				logger.debug(JSON.stringify(data));
				await pb.collection('state').update(state.id, data);
				client.send(JSON.stringify({type: 'progress', phase: 'done', withError: !success}));
			}
		})
		.catch(e => {
			logger.error('S2 Could not authorize PocketBase Service User. Check Credentials!');
			logger.error(e);
			client.send(JSON.stringify({type: 'error', msg: 'Internal Error (S2)'})); // ERROR S2
			client.close(1011);
		});
}
