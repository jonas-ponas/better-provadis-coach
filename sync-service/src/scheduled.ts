import logger from './logger';
import {PB_PASSWD, PB_URL, PB_USER} from './server';
import {sync} from './sync';

const Pocketbase = require('pocketbase/cjs');

export async function scheduled({
	pocketbase,
	maxUsers,
	lastSyncDiff
}: {
	pocketbase: {
		url: string;
		user: string;
		password: string;
	};
	maxUsers?: number; // 30
	lastSyncDiff?: number; // 1000 * 60 * 20
}) {
	logger.info(`Scheduled Sync started (${new Date().toISOString()})`);

	if (!PB_USER || !PB_PASSWD || !PB_URL) {
		logger.error(`PocketBase Service User/Url not specified! Check env-variables!`);
		return;
	}

	const pb = new Pocketbase(pocketbase.url);
	try {
		await pb.admins.authWithPassword(pocketbase.user, pocketbase.password);
	} catch (e: unknown) {
		logger.error(`Could not authorize in PocketBase backend. Check service user credentials: ${e}`);
		if (e instanceof Error) logger.error(e.stack);
		return;
	}
	let result;
	try {
		result = await pb.collection('state').getFullList(undefined, {
			filter: 'refreshToken != null && user.autoSync = true'
		});
	} catch (e: unknown) {
		logger.error(`Could not obtain users to sync: ${e}`);
		if (e instanceof Error) logger.error(e.stack);
		return;
	}
	logger.info(`Received ${result.length} Users`);
	logger.debug(`Users: ${result.map((record: any) => record.coachUsername).join(', ')}`);
	const promises = result.map((record: any) => {
		logger.debug(JSON.stringify(record));
		return sync({
			onProgress: () => {},
			onClose: () => {},
			pocketbase: {
				url: PB_URL ?? '',
				user: PB_USER ?? '',
				password: PB_PASSWD ?? ''
			},
			userId: record.user,
			withNews: true
		});
	});
	Promise.all(promises)
		.then(() => {
			logger.info('Finished Syncing Users');
		})
		.catch(() => {});
}
