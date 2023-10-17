import PocketBase from 'pocketbase/cjs';
import {
	ChangelogRecord,
	Collections,
	DirectoryResponse,
	FileResponse,
	StateRecord,
	StateResponse,
	UserFilesResponse
} from '../pocketbase-types';
import logger from '../logger';
import { Coach, UserInfo, File, Directory } from '../coach/Coach';
import { FileDiffResult, fileDiff, seperateFilesToInsertFromFilesToGrant } from './fileDiff';
import { SHA1 } from 'crypto-js';
import { ActionResult, grant, insertAndGrant, insertDirectoriesInOrder, insertDirectory } from './actions';
import { directoryDiff } from './dirDiff';

// Message Types
type CloseMessage = { type: 'close'; success: boolean; reason: string };
type ProgressMessage = { type: 'progress'; stage: string; message?: string; [key: string]: any };

export async function syncFiles({
	client,
	onProgress,
	userId
}: {
	client: PocketBase;
	userId: string;
	onProgress: (message: CloseMessage | ProgressMessage) => void;
}) {
	const startTime = new Date();

	async function endWithSuccess(
		reason: string,
		options: {
			stateId: string;
			coach: Coach;
			hash?: {
				file?: string;
				directory?: string;
				news?: string;
			};
			report?: {
				success: number;
				fail: number;
				total: number;
			};
			diff?: FileDiffResult;
		}
	) {
		const changelogRequest = client.collection(Collections.Changelog).create<ChangelogRecord>({
			time: new Date().toISOString(),
			triggered_by: userId,
			diff: options.diff
				? JSON.stringify({
						a: options.diff.added?.map(f => f.name),
						m: options.diff.modified?.map(f => f.coach.name),
						r: options.diff.removed?.map(f => f.name)
				  })
				: '{}',
			success: true,
			secondsSpent: new Date().getTime() - startTime.getTime() / 1000,
			reason
		});
		const coachState = coach.exportFromState();
		const expires = new Date(coachState.expires || 0).toISOString();
		const stateRequest = client.collection(Collections.State).update<StateRecord>(options.stateId, {
			lastFilesHash: options.hash?.file ?? undefined,
			lastNewsHash: options.hash?.news ?? undefined,
			lastDirHash: options.hash?.directory ?? undefined,
			...coachState,
			expires
		});
		await Promise.all([changelogRequest, stateRequest]);
		onProgress({ type: 'close', success: true, reason: '' });
	}

	async function endWithFailure(
		reason: string,
		options: {
			coach?: Coach;
			doNotStore?: boolean;
		} = {}
	) {
		const changelogRequest = client.collection(Collections.Changelog).create<ChangelogRecord>({
			time: new Date().toISOString(),
			triggered_by: userId,
			diff: '{}',
			success: false,
			secondsSpent: new Date().getTime() - startTime.getTime() / 1000,
			reason
		});
		try {
			await Promise.all([changelogRequest]);
		} catch (e) {
			logger.error(e);
		} finally {
			onProgress({ type: 'close', success: false, reason: reason });
		}
	}

	onProgress({ type: 'progress', stage: 'dump', progress: 0, total: 4 });

	// Get Files from DB
	let currentFiles: FileResponse[];
	let currentDirs: DirectoryResponse[];
	let currentUserFiles: UserFilesResponse[];
	try {
		currentFiles = await client.collection(Collections.File).getFullList();
		onProgress({ type: 'progress', stage: 'dump', progress: 1, total: 4 });

		currentUserFiles = await client.collection(Collections.UserFiles).getFullList({
			filter: `user.id = '${userId}'`
		});
		onProgress({ type: 'progress', stage: 'dump', progress: 2, total: 4 });
		currentDirs = await client.collection(Collections.Directory).getFullList();
		onProgress({ type: 'progress', stage: 'dump', progress: 3, total: 4 });
	} catch (e: unknown) {
		logger.error(`S5 Could not retrieve current Database State! Check Credentials! ${e}`);
		if (e instanceof Error) logger.error(e.stack);
		await endWithFailure('error while data dump');
		return;
	}
	logger.debug(`Retrieved Current DB: ${currentFiles.length} ${currentUserFiles.length} ${currentDirs.length}`);
	// Get State from DB
	let state: StateResponse;
	try {
		state = await client.collection('state').getFirstListItem(`user.id = "${userId}"`);
		onProgress({ type: 'progress', stage: 'dump', progress: 4, total: 4 });
	} catch (e: unknown) {
		logger.error(e);
		await endWithFailure('error while state retrieval');
		return;
	}

	onProgress({ type: 'progress', stage: 'coach', progress: 0, total: 2 });

	// Initialize Coach
	let coach: Coach;
	try {
		coach = await Coach.createFromState(state, logger, ({ accessToken, refreshToken, expires }) => {
			if (!accessToken || !refreshToken || !expires) return;
			updateTokenStore(state.id, client, { accessToken, refreshToken, expires });
		});
		onProgress({ type: 'progress', stage: 'coach', message: 'coach logged in', progress: 1, total: 2 });
	} catch (e: unknown) {
		logger.error(e);
		await endWithFailure('error while coach init');
		return;
	}

	// Get Coach User-Info
	let userinfo: UserInfo;
	try {
		userinfo = await coach.getUserInfo();
		const fullname = userinfo.user.firstname + ' ' + userinfo.user.familyname;
		logger.info('Got User-Name' + fullname);
		onProgress({ type: 'progress', stage: 'coach', progress: 2, total: 2, fullname });
	} catch (e: unknown) {
		logger.error(e);
		await endWithFailure('error while getting user-info', {
			coach
		});
		return;
	}

	// Get Coach Directories
	let directories: Directory[];
	try {
		directories = await coach.getDirectories();
		logger.info('Retrieved ' + directories.length + ' Directories');
		onProgress({ type: 'progress', stage: 'directory-sync', message: 'got dirs', count: directories.length });
	} catch (e: unknown) {
		logger.error(e);
		await endWithFailure('error while retrieving directory ', { coach });
		return;
	}

	const hashedDirResponse = SHA1(JSON.stringify(directories)).toString();
	if (hashedDirResponse == state.lastDirHash) {
		await endWithSuccess('directory response hash equals', {
			stateId: state.id,
			coach,
			hash: { directory: hashedDirResponse }
		});
		return;
	}

	const { added: addedDirs } = directoryDiff({
		current: currentDirs,
		incoming: directories
	});
	logger.info(`Directory-Diff: +${addedDirs?.length}`);
	onProgress({ type: 'progress', stage: 'directory-sync', progress: 0, total: addedDirs?.length });

	const idMap = await insertDirectoriesInOrder(client, addedDirs ?? [], currentDirs, (current, total) => {
		onProgress({ type: 'progress', stage: 'directory-sync', progress: current, total: total });
	});

	// Get Coach Files
	let files: File[];
	try {
		files = await coach.getFiles();
		logger.info('Retrieved ' + files.length + ' Files');
		onProgress({ type: 'progress', stage: 'file-sync', message: 'got files', count: files.length });
	} catch (e: unknown) {
		logger.error(e);
		await endWithFailure('error while retrieving files', { coach });
		return;
	}

	// Check hash
	const hashedFileResponse = SHA1(JSON.stringify(files)).toString();
	if (hashedFileResponse == state.lastFilesHash) {
		await endWithSuccess('file response hash equals', {
			stateId: state.id,
			coach,
			hash: { file: hashedFileResponse, directory: hashedDirResponse }
		});
		return;
	}

	// Calc Difference
	const diff = fileDiff({
		current: currentFiles,
		incoming: files
	});
	if (diff.added?.length === 0 && diff.removed?.length === 0 && diff.modified?.length === 0) {
		await endWithSuccess('file difference is zero', {
			stateId: state.id,
			coach,
			hash: { file: hashedFileResponse, directory: hashedDirResponse }
		});
		return;
	}

	// Calc User Difference
	const userDiff = fileDiff({
		current: currentUserFiles as FileResponse[],
		incoming: files
	});

	// Get Concrete Actions to Do
	const { filesToGrant, filesToInsert } = seperateFilesToInsertFromFilesToGrant(diff, userDiff, currentFiles);
	const filesToRevoke = userDiff.removed ?? [];
	const filesToModify = diff.modified ?? [];
	onProgress({
		type: 'progress',
		stage: 'file-diff',
		insert: filesToInsert?.length,
		grant: filesToGrant?.length,
		revoke: filesToRevoke?.length,
		modify: filesToModify?.length
	});
	let success = 0;
	let fail = 0;
	let percent = 0;
	const total = filesToInsert.length + filesToGrant.length + filesToRevoke?.length + filesToModify.length;

	function updateState(result: ActionResult) {
		if (result.success) success = success + 1;
		else fail = fail + 1;
		const p = ((success + fail) / total) * 100;
		if (Math.floor(p) > Math.floor(percent)) {
			percent = Math.floor(p);
			onProgress({ type: 'progress', stage: 'file-insert', progress: percent, fail, success, total });
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
	endWithSuccess('Sync successful!', {
		stateId: state.id,
		coach,
		hash:
			fail > 0 || fail + success < total
				? undefined
				: {
						file: hashedFileResponse,
						directory: hashedDirResponse
				  },
		diff: userDiff,
		report: { fail, success, total }
	});
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
