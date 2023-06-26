import PocketBase from 'pocketbase/cjs';
import {
	Collections,
	DirectoryResponse,
	FileRecord,
	FileResponse,
	StateResponse,
	UserFilesResponse
} from '../pocketbase-types';
import logger from '../logger';
import { Coach, UserInfo, File, Directory } from '../coach/Coach';
import { fileDiff, seperateFilesToInsertFromFilesToGrant } from './fileDiff';
import { SHA1 } from 'crypto-js';
import { ActionResult, grant, insert, insertAndGrant, insertDirectoriesInOrder, insertDirectory } from './actions';
import { directoryDiff, sortDirectoriesByHirarchy } from './dirDiff';
import { writeFileSync } from 'fs';

export async function syncFiles({
	client,
	onProgress,
	userId
}: {
	client: PocketBase;
	userId: string;
	onProgress: (message: { [key: string]: any }) => void;
}) {
	onProgress({ type: 'prepare' });

	// Get Files from DB
	let currentFiles: FileResponse[];
	let currentDirs: DirectoryResponse[];
	let currentUserFiles: UserFilesResponse[];
	try {
		currentFiles = await client.collection(Collections.File).getFullList();
		currentUserFiles = await client.collection(Collections.UserFiles).getFullList({
			filter: `user.id = '${userId}'`
		});
		currentDirs = await client.collection(Collections.Directory).getFullList();
	} catch (e: unknown) {
		logger.error(`S5 Could not retrieve current Database State! Check Credentials! ${e}`);
		if (e instanceof Error) logger.error(e.stack);
		onProgress({ type: 'error', message: 'error while data dump' }); // ERROR S2
		await endWithFailure();
		return;
	}
	logger.debug(`Retrieved Current DB: ${currentFiles.length} ${currentUserFiles.length} ${currentDirs.length}`);
	onProgress({ db: currentFiles.length, user: currentUserFiles.length, dirs: currentDirs.length });
	// Get State from DB
	let state: StateResponse;
	try {
		state = await client.collection('state').getFirstListItem(`user.id = "${userId}"`);
		onProgress({ type: 'prepare', message: 'retrieved state' });
	} catch (e: unknown) {
		onProgress({ type: 'error', message: 'error while state retrieval!' });
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
		onProgress({ type: 'prepare', message: 'coach logged in' });
	} catch (e: unknown) {
		onProgress({ type: 'error', error: 'error while coach init!' });
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
		onProgress({ type: 'prepare', message: fullname });
	} catch (e: unknown) {
		onProgress({ type: 'error', message: 'error while getting user-info' });
		logger.error(e);
		await endWithFailure();
		return;
	}

	// Get Coach Directories
	let directories: Directory[];
	try {
		directories = await coach.getDirectories();
		logger.info('Retrieved ' + directories.length + ' Directories');
		onProgress({ type: 'directory-sync', message: 'got dirs', count: directories.length });
	} catch (e: unknown) {
		onProgress({ type: 'error', message: 'error while directory retrieving' });
		logger.error(e);
		await endWithFailure();
		return;
	}

	const hashedDirResponse = SHA1(JSON.stringify(directories)).toString();
	if (hashedDirResponse == state.lastDirHash) {
		onProgress({ type: 'directory-sync', message: '`same directory response! end.`' });
		await endWithSuccess();
		return;
	}

	const { added: addedDirs } = directoryDiff({
		current: currentDirs,
		incoming: directories
	});
	logger.info(`Directory-Diff: +${addedDirs?.length}`);
	onProgress({ type: 'directory-sync', insert: addedDirs?.length });

	const idMap = await insertDirectoriesInOrder(client, addedDirs ?? [], currentDirs, (current, total) => {
		onProgress({ type: 'directory-sync', progress: current, total: total });
	});

	onProgress({ type: 'directory-sync', message: 'finished dirs :)' });

	// Get Coach Files
	let files: File[];
	try {
		files = await coach.getFiles();
		logger.info('Retrieved ' + files.length + ' Files');
		onProgress({ type: 'file-sync', message: 'got files', count: files.length });
	} catch (e: unknown) {
		onProgress({ type: 'error', message: 'error while file retrieving' });
		logger.error(e);
		await endWithFailure();
		return;
	}

	// Check hash
	const hashedFileResponse = SHA1(JSON.stringify(files)).toString();
	if (hashedFileResponse == state.lastFilesHash) {
		onProgress({ type: 'file-sync', message: '`same files response! end.`' });
		await endWithSuccess();
		return;
	}

	// Calc Difference
	const diff = fileDiff({
		current: currentFiles,
		incoming: files
	});
	if (diff.added?.length === 0 && diff.removed?.length === 0 && diff.modified?.length === 0) {
		onProgress({ type: 'file-sync', message: `no changes! end.` });
		await endWithSuccess();
		return;
	}

	// Calc User Difference
	const userDiff = fileDiff({
		current: currentUserFiles as FileResponse[],
		incoming: files
	});

	// Get Concrete Actions to Do
	const { filesToGrant, filesToInsert } = seperateFilesToInsertFromFilesToGrant(diff, userDiff, currentFiles);
	const filesToRevoke = userDiff.removed;
	const filesToModify = diff.modified;
	onProgress({
		insert: filesToInsert?.length,
		grant: filesToGrant?.length,
		revoke: filesToRevoke?.length,
		modify: filesToModify?.length
	});
	let success = 0;
	let fail = 0;
	let percent = 0;
	const total = filesToInsert.length + filesToGrant.length;

	function updateState(result: ActionResult) {
		if (result.success) success = success + 1;
		else fail = fail + 1;
		const p = ((success + fail) / total) * 100;
		if (Math.floor(p) > Math.floor(percent)) {
			percent = Math.floor(p);
			onProgress({ type: 'file-sync', progress: percent, fail, success, total });
		}
	}

	const inserts = Promise.all(
		filesToInsert.map(async fileToInsert => {
			const result = await insertAndGrant({
				client,
				coach,
				fileToInsert,
				userId,
				directories,
				idMap
			});
			updateState(result);
		})
	);
	const grants = Promise.all(
		filesToGrant.map(async fileToGrant => {
			const result = await grant({ client, fileToGrant, userId });
			updateState(result);
		})
	);

	// TODO: Revoke

	await Promise.all([grants, inserts]);
	onProgress({ type: 'file-sync', message: 'finished :)' });
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
