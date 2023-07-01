import PocketBase from 'pocketbase/cjs';
import { Coach, Directory, File } from '../coach/Coach';
import {
	AclRecord,
	Collections,
	DirectoryRecord,
	DirectoryResponse,
	FileRecord,
	FileResponse
} from '../pocketbase-types';
import logger from '../logger';
import { createHash } from 'node:crypto';
import { ClientResponseError } from '../util';
import { Logger } from 'winston';
import { sortDirectoriesByHirarchy } from './dirDiff';

export type ActionResult = {
	success: boolean;
	file?: FileResponse;
	directory?: DirectoryResponse;
};

export type IdMap = { [key: number]: string };

export async function insertDirectory(
	client: PocketBase,
	directory: Directory,
	parentId: string | null,
	allDirs: DirectoryResponse[]
): Promise<ActionResult> {
	try {
		const record: DirectoryRecord = {
			name: directory.name,
			coachId: directory.id,
			timestamp: directory.modified.timestamp,
			parent: parentId === null ? undefined : parentId,
			fullpath: ''
		};
		record.fullpath = JSON.stringify(
			getFullPathForDirectory(Object.assign({ id: '' }, record) as DirectoryResponse, allDirs)
		);
		const result = await client
			.collection(Collections.Directory)
			.create<DirectoryResponse>(record, { $cancelKey: `${record.coachId}` });
		logger.debug(`Inserted Dir "${record.name}"`);
		return { success: true, directory: result };
	} catch (e: unknown) {
		logError(e);
		return { success: false };
	}
}

export async function insertDirectoriesInOrder(
	client: PocketBase,
	directories: Directory[],
	directoriesInDB: DirectoryResponse[],
	onProgress: (current: number, total: number) => void
) {
	const idMap: IdMap = {};
	const coachIdToPbId = (coachId: number) => idMap[coachId] ?? null;

	directoriesInDB.forEach(record => {
		idMap[record.coachId] = record.id;
	});

	const sorted = sortDirectoriesByHirarchy(directories);
	let current = 0;
	const total = sorted.length;
	await sorted.reduce((cur, next) => {
		return cur.then(result => {
			current++;
			onProgress(current, total);
			if (!result.success) {
				logger.warn(`Inserting Directory failed? ${JSON.stringify(result)}`);
				return new Promise<ActionResult>(resolve => resolve({ success: true }));
			} else {
				if (result.directory) {
					idMap[result.directory.coachId] = result.directory.id;
					directoriesInDB.push(result.directory);
				}
				const parentId = coachIdToPbId(next.parent_id);
				if (parentId === null) logger.warn('Parent-Id is null for ' + next.name);
				return insertDirectory(client, next, parentId, directoriesInDB);
			}
		});
	}, new Promise<ActionResult>(resolve => resolve({ success: true })));

	return idMap;
}

// see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
async function hashBuffer(buffer: ArrayBuffer) {
	return createHash('sha256').update(new Uint8Array(buffer)).digest('hex');
}

type insertArgs = {
	client: PocketBase;
	coach: Coach;
	fileToInsert: File;
	directories: Directory[];
	idMap: IdMap;
};

export async function insert({ client, coach, fileToInsert, directories, idMap }: insertArgs): Promise<ActionResult> {
	const arrayBuffer = await coach.getFileContentStream(fileToInsert.id);
	const fileName = `${fileToInsert.name}.${fileToInsert.mime}`;
	const hash = await hashBuffer(arrayBuffer);
	const fullpath = getFullPathForFile(fileToInsert, directories);
	const formData = new FormData();
	formData.append('content', new Blob([arrayBuffer]), fileName);
	const fileRecord: Omit<FileRecord, 'content'> = {
		name: fileName,
		fullpath: fullpath,
		size: fileToInsert.size,
		timestamp: fileToInsert.timestamp,
		coachId: fileToInsert.id,
		hash: hash,
		directory: idMap[fileToInsert.directory.id]
	};

	Object.entries(fileRecord).forEach(([key, value]) => {
		formData.append(key, `${value}`);
	});

	try {
		const result = await client.collection(Collections.File).create<FileResponse>(formData, {
			$cancelKey: `${fileToInsert.id}`
		});
		logger.debug(`Inserted file "${result.fullpath}" (${result.id})`);
		return {
			success: true,
			file: result
		};
	} catch (e: unknown) {
		if (e instanceof Error && e.name.startsWith('ClientResponseError')) {
			let error = e as ClientResponseError;
			if (error.status === 400 && error.response?.data?.hash) {
				logger.warn(`File-Hash Collision: ${fullpath} (${hash})`);
				return insertWithHashCollision(formData, client, coach);
			}
		}
		logger.warn('Could not insert ' + fullpath);
		logError(e);
		return {
			success: false
		};
	}
}

async function insertWithHashCollision(formData: FormData, client: PocketBase, coach: Coach): Promise<ActionResult> {
	const hash = formData.get('hash');
	let sameFile: FileResponse | null;
	try {
		sameFile = await client.collection(Collections.File).getFirstListItem<FileResponse>(`hash = "${hash}"`);
		if (!sameFile) return { success: false };
	} catch (e: unknown) {
		logError(e);
		return { success: false };
	}

	formData.delete('hash');
	formData.delete('content');
	formData.append('equals', sameFile.id);
	formData.append('hash', `${hash}-${formData.get('coachId')}`);
	let result: FileResponse;
	try {
		result = await client.collection(Collections.File).create(formData);
	} catch (e: unknown) {
		logError(e);
		return { success: false };
	}
	logger.debug(`Inserted file (with collision) "${result.fullpath}" (${result.id})`);
	return { success: true, file: result };
}

function getFullPathForFile(file: File, allDirs: Directory[]): string {
	const path = [file.directory.name, `${file.name}.${file.mime}`];
	const parentDirectory = allDirs.find(v => v.id === file.directory.parent);
	if (!parentDirectory) return path.join('/');
	return [...getFullPath(parentDirectory, allDirs), ...path].join('/');
}

function getFullPath(dir: Directory, allDirs: Directory[]): string[] {
	const parentDir = allDirs.find(v => v.id === dir.parent_id);
	if (!parentDir) return [''];
	return [...getFullPath(parentDir, allDirs), dir.name];
}

function getFullPathForDirectory(
	dir: DirectoryResponse,
	allDirs: DirectoryResponse[]
): { id?: string; label: string }[] {
	const parentDir = allDirs.find(v => v.id == dir.parent);
	if (!parentDir) return [];
	return [...getFullPathForDirectory(parentDir, allDirs), { label: dir.name, id: dir.id }];
}

type grantArgs = {
	client: PocketBase;
	fileToGrant: FileResponse;
	userId: string;
};

export async function grant({ client, fileToGrant, userId }: grantArgs): Promise<ActionResult> {
	try {
		await client.collection(Collections.Acl).create<AclRecord>(
			{
				file: fileToGrant.id,
				user: userId
			},
			{ $cancelKey: `${fileToGrant.id}${userId}` }
		);
		return { success: true };
	} catch (e) {
		logError(e);
		return { success: false };
	}
}

export async function revoke(client: PocketBase, file: FileResponse[], userId: string): Promise<ActionResult> {
	// TODO
	return { success: false };
}

export async function insertAndGrant({
	client,
	coach,
	fileToInsert,
	directories,
	userId,
	idMap
}: insertArgs & Omit<grantArgs, 'fileToGrant'>): Promise<ActionResult> {
	try {
		const result = await insert({ client, coach, fileToInsert, directories, idMap });
		if (result.success && result.file) {
			await grant({ client, userId, fileToGrant: result.file });
			return result;
		} else {
			logger.warn('Insert failed. So cannot grant.');
			return { success: false };
		}
	} catch (e: unknown) {
		logError(e);
		logger.error(e);
		return { success: false };
	}
}

function logError(e: unknown) {
	if (e instanceof Error && e.name.startsWith('ClientResponseError')) {
		let error = e as ClientResponseError;
		if (error.isAbort) logger.warn('Pocketbase-Call was autocancelled!');
		logger.error(`${error.name} (${error.url}): ${JSON.stringify(error.response)}`);
	} else if (e instanceof Error) {
		logger.error(e.stack);
	} else {
		logger.error(e);
	}
}
