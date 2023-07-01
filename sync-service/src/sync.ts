import { createHash } from 'crypto';
const PocketBase = require('pocketbase/cjs');
import { Coach } from './coach/Coach';
import logger from './logger';
import coachToPocketbase from './pocketbase/coachToPocketbase';
import { MyWebSocketMessage } from './server';
import { FileRecord } from '../types';
import { fileDiff } from './diff';

export async function sync({
	onProgress,
	onClose,
	pocketbase,
	userId,
	withNews = false
}: {
	onProgress: (msg: MyWebSocketMessage) => void;
	onClose: (code: number) => void;
	pocketbase: {
		url: string;
		user: string;
		password: string;
	};
	userId: string;
	withNews?: boolean;
}) {
	onProgress({ type: 'progress', phase: 'auth' });
	const pb = new PocketBase(pocketbase.url);
	try {
		await pb.admins.authWithPassword(pocketbase.user, pocketbase.password);
	} catch (e: unknown) {
		logger.error(`S2 Could not authorize PocketBase Service User. Check Credentials! ${e}`);
		if (e instanceof Error) logger.error(e.stack);
		onProgress({ type: 'error', msg: 'Internal Error (S2)' }); // ERROR S2
		onClose(1011);
		return;
	}
	let currentFiles: FileRecord[];
	try {
		currentFiles = await pb.collection('file').getFullList({
			sort: '-created'
		});
	} catch (e: unknown) {
		logger.error(`S5 Could not retrieve current Database State! Check Credentials! ${e}`);
		if (e instanceof Error) logger.error(e.stack);
		onProgress({ type: 'error', msg: 'Internal Error (S5)' }); // ERROR S2
		onClose(1011);
		return;
	}

	let coach: Coach;
	let state;
	try {
		onProgress({ type: 'progress', phase: 'state' });
		state = await pb.collection('state').getFirstListItem(`user.id = "${userId}"`);
		onProgress({ type: 'progress', phase: 'coach', step: 1 });
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
			logger,
			op => {
				logger.info('Token-Change! ' + JSON.stringify(op));
			}
		);
		onProgress({ type: 'progress', phase: 'coach', step: 2 });
	} catch (e) {
		logger.error(`S4 Could not create Coach from state: ${e}`);
		if (e instanceof Error) logger.error((e as Error).stack);
		onProgress({ type: 'error', msg: 'Internal Error: Could not login into Provadis Coach (S4)' }); // ERROR S4
		onClose(1011);
		return;
	}
	let success = false;
	let username;
	let filesHash = '';
	let newsHash;
	try {
		const user = await coach.getUserInfo();
		onProgress({ type: 'progress', phase: 'coach', step: 3 });
		username = user.user.firstname + ' ' + user.user.familyname;
		logger.info(`Syncing Files for: ${username}`);

		const dirs = await coach.getDirectories();
		onProgress({ type: 'progress', phase: 'coach', step: 4 });

		const files = await coach.getFiles();
		onProgress({ type: 'progress', phase: 'database', step: 1 });
		filesHash = createHash('md5').update(JSON.stringify(files)).digest('hex');

		if (filesHash !== state.lastFilesHash) {
			const diff = fileDiff({
				current: currentFiles,
				incoming: files
			});

			console.log(diff);

			// const ctoPb = await coachToPocketbase.insertDirectories(dirs, pb, state.user, new Map(), (i, t) => {
			// 	onProgress({ type: 'progress', phase: 'database', step: 1, detail: i, total: t });
			// });
			// onProgress({ type: 'progress', phase: 'database', step: 2 });
			// const fToPb = await coachToPocketbase.insertFiles(files, pb, state.user, ctoPb, (i, t) => {
			// 	onProgress({ type: 'progress', phase: 'database', step: 2, detail: i, total: t });
			// });
			// onProgress({ type: 'progress', phase: 'database', step: 3 });
			// await coachToPocketbase.insertCacheFiles(pb, coach, fToPb, (i, t) => {
			// 	onProgress({ type: 'progress', phase: 'database', step: 3, detail: i, total: t });
			// });
		} else {
			logger.debug('Current File Hash is equal to last one. Skipping.');
		}
		if (withNews) {
			const news = await coach.getNews();
			onProgress({ type: 'progress', phase: 'database', step: 4 });
			newsHash = createHash('md5').update(JSON.stringify(news)).digest('hex');
			if (newsHash !== state.lastNewsHash) {
				await coachToPocketbase.insertNewsItems(news, pb, state.user, (i, t) => {
					onProgress({ type: 'progress', phase: 'database', step: 4, detail: i, total: t });
				});
			} else {
				logger.debug('Current News Hash is equal to last one. Skipping.');
			}
		}
		success = true;
	} catch (e) {
		logger.error(`S3 Error occured while syncing: ${e}`);
		if (e instanceof Error) logger.error((e as Error).stack);
		onProgress({ type: 'error', msg: 'Internal Error (S3)' }); // ERROR S3
		onClose(1011);
	} finally {
		const currentState = coach.exportFromState();
		const data: any = {
			refreshToken: currentState.refreshToken,
			token: currentState.token,
			expires: new Date(currentState.expires || 0).toISOString(),
			url: currentState.url,
			coachUserId: currentState.userId,
			lastSync: success ? new Date().toISOString() : state.lastSync,
			lastSyncSuccessful: success,
			coachUsername: username || state.coachUsername,
			lastFilesHash: filesHash,
			lastNewsHash: newsHash
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
			logger.error(`DATA: ${JSON.stringify(data)}`);
			logger.error(`Failed to write state back to pocketbase! ${e}`);
			if (e instanceof Error) logger.error((e as Error).stack);
			onProgress({
				type: 'error',
				msg: 'Failed to write back token information. Consider reconnecting Coach via QR-Code'
			});
		}
		onProgress({ type: 'progress', phase: 'done' });
	}
}
