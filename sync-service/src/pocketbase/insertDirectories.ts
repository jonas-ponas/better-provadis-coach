// import pocketbaseEs, { ClientResponseError } from "pocketbase";
import { Directory } from '../coach/Coach';
import logger from '../logger';

export default async function insertDirectories(
	directories: Directory[],
	pb: any,
	userId?: string,
	cToPbMap?: Map<number, string>,
	onProgress?: (i: number, t: number) => void
) {
	cToPbMap = cToPbMap || new Map<number, string>();
	const updateDirs: Directory[] = [];
	if (!pb.authStore.isValid) throw Error('Pocketbase-AuthStore not valid');
	const total = directories.length;
	let i = 0;
	for (const directory of directories) {
		try {
			const create = await pb.collection('directory').create({
				name: directory.name,
				timestamp: directory.modified.timestamp,
				coachId: directory.id,
				allowedUser: userId ? [userId] : []
			});
			cToPbMap.set(directory.id, create.id);
			updateDirs.push(directory);
			logger.debug(`Created ${create.name} ${create.id} ${create.coachId}`);
			if (onProgress) onProgress(++i, total);
		} catch (e: any) {
			try {
				const record = await pb.collection('directory').getFirstListItem(`coachId = ${directory.id}`);
				if (record?.id) {
					cToPbMap.set(record.coachId, record.id);
					let nameChanged = directory.name != record?.name;
					let dateNew = new Date(
						directory.modified.timestamp.endsWith('.000Z')
							? directory.modified.timestamp
							: directory.modified.timestamp + '.000Z'
					);
					let dateOld = new Date(record?.timestamp);
					let wasModified = dateNew.getTime() !== dateOld.getTime();
					let userExists = userId == undefined ? true : record.allowedUser.includes(userId);
					if (nameChanged || wasModified || !userExists) {
						logger.verbose(`wasModified: ${directory.modified.timestamp} !== ${record?.timestamp}`);
						const update = await pb.collection('directory').update(record.id, {
							name: directory.name,
							timestamp: directory.modified.timestamp,
							allowedUser: userExists ? record.allowedUser : [...record.allowedUser, userId]
						});
						logger.debug(`Updated ${update.name} ${update.id} ${update.coachId}`);
						if (onProgress) onProgress(++i, total);
					} else {
						if (onProgress) onProgress(++i, total);
					}
				}
			} catch (e) {
				logger.warn(`Search/Update failed (${directory.name}, ${directory.id}): ${e}`);
				if (onProgress) onProgress(++i, total);
			}
		}
	}

	for (const directory of updateDirs) {
		let parentId = cToPbMap.get(directory.parent_id);
		const id = cToPbMap.get(directory.id);
		if (!parentId) {
			try {
				const record = pb.collection('directory').getFirstListItem(`coachId = ${directory.id}`);
				if (record?.id) {
					parentId = record.id;
				} else {
					logger.debug(`Cannot find parent ${directory.parent_id} for ${directory.name} ${directory.id}`);
					continue;
				}
			} catch (e) {
				logger.warn(`Failed find parent ${directory.parent_id} for ${directory.name} ${directory.id}: ${e}`);
				continue;
			}
		}
		try {
			const update = await pb.collection('directory').update(id, {
				parent: parentId
			});
			logger.debug(`Updated Parent for ${update.name} ${update.id}`);
		} catch (e) {
			logger.warn(`Failed to update ${directory.name} ${directory.id}: ${e}`);
		}
	}
	return cToPbMap;
}
