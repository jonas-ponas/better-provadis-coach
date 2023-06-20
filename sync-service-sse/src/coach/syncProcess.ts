import PocketBase from 'pocketbase/cjs';
import { FileRecord, StateRecord } from '../schema';
import logger from '../logger';
import { Coach, UserInfo, File } from './Coach';
import { fileDiff } from '../diff';
import { SHA1 } from 'crypto-js';

const state = {};

export async function syncFiles({
	client,
	onProgress,
	userId
}: {
	client: PocketBase;
	userId: string;
	onProgress: (message: string) => void;
}) {
	onProgress('start');

	// Get Files from DB
	let currentFiles: FileRecord[];
	try {
		currentFiles = await client.collection('file').getFullList({
			// filter: `allowedUser.id ~ "${userId}"` // TODO: Evaluate
		});
	} catch (e: unknown) {
		logger.error(`S5 Could not retrieve current Database State! Check Credentials! ${e}`);
		if (e instanceof Error) logger.error(e.stack);
		onProgress('error while data dump'); // ERROR S2
		await endWithFailure();
		return;
	}
	logger.debug(`Retrieved Current Files: ${currentFiles.length}`);
	onProgress('dumped db: ' + currentFiles.length);

	// Get State from DB
	let state: StateRecord;
	try {
		state = await client.collection('state').getFirstListItem(`user.id = "${userId}"`);
		onProgress('retrieved state');
	} catch (e: unknown) {
		onProgress('error while state retrieval!');
		logger.error(e);
		await endWithFailure();
		return;
	}

	// Initialize Coach
	let coach: Coach;
	try {
		coach = await Coach.createFromState(state, logger, ({ accessToken, refreshToken, expires }) => {
			if (!accessToken || !refreshToken || !expires) return;
			updateTokenStore(state.id, client, { accessToken, refreshToken, expires });
		});
		onProgress('coach logged in');
	} catch (e: unknown) {
		onProgress('error while coach init!');
		logger.error(e);
		await endWithFailure();
		return;
	}

	// Get Coach User-Info
	let userinfo: UserInfo;
	try {
		userinfo = await coach.getUserInfo();
		const fullname = userinfo.user.firstname + ' ' + userinfo.user.familyname;
		logger.info('Got User-Name' + fullname);
		onProgress('hi ' + fullname);
	} catch (e: unknown) {
		onProgress('error while getting user-info');
		logger.error(e);
		await endWithFailure();
		return;
	}

	// Get Coach Files
	let files: File[];
	try {
		files = await coach.getFiles();
		logger.info('Retrieved ' + files.length + ' Files');
		onProgress('got files');
	} catch (e: unknown) {
		onProgress('error while file retrieving');
		logger.error(e);
		await endWithFailure();
		return;
	}

	// Check hash
	const hashedFileResponse = SHA1(JSON.stringify(files)).toString();
	if (hashedFileResponse == state.lastFilesHash) {
		onProgress(`same response! end.`);
		await endWithSuccess();
		return;
	}

	// Calc Difference
	const diff = fileDiff({
		current: currentFiles,
		incoming: files,
		userId: userId
	});
	logger.info(`Diff: +${diff.added?.length}; -${diff.removed?.length}; ✎ ${diff.modified?.length}`);
	onProgress(`diff +${diff.added?.length}; -${diff.removed?.length}; ✎${diff.modified?.length}`);
	if (diff.added?.length === 0 || diff.removed?.length === 0 || diff.modified?.length === 0) {
		onProgress(`no changes! end.`);
		await endWithSuccess();
		return;
	}
}

async function updateTokenStore(
	stateId: string,
	client: PocketBase,
	data: {
		refreshToken: string;
		accessToken: string;
		expires: number;
	}
) {
	logger.info('Token Change ' + JSON.stringify(data));
	try {
		await client.collection('state').update(stateId, {
			refreshToken: data.refreshToken,
			token: data.accessToken,
			expires: new Date(data.expires || 0).toISOString()
		});
	} catch (e: unknown) {
		logger.error(`Failed to write state back to pocketbase! ${e}`);
		if (e instanceof Error) logger.error((e as Error).stack);
	}
}

async function endWithSuccess() {}

async function endWithFailure() {}
