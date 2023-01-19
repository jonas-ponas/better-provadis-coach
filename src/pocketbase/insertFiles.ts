import {File} from '../coach/Coach';
import logger from '../logger';
// import pocketbaseEs from "pocketbase"

export default async function insertFiles(
	files: File[],
	pb: any,
	userId?: string,
	cToPbMap?: Map<number, string>,
	onProgress?: (i: number, t: number) => void
) {
	cToPbMap = cToPbMap || new Map<number, string>();
	const fToPbMap = new Map<number, {pbId: string; name: string}>();
	if (!pb.authStore.isValid) throw Error('Pocketbase-AuthStore not valid');
	const total = files.length;
	let i = 0;
	for (const file of files) {
		let parentId = cToPbMap.get(file.directory.id);
		if (!parentId) {
			try {
				const record = await pb.collection('directory').getFirstListItem(`coachId=${file.directory.id}`);
				parentId = record.id;
			} catch (e) {
				logger.log(
					'debug',
					`Cannot find parent ${file.directory.name} ${file.directory.id} for ${file.name} ${file.id}`
				);
				continue;
			}
		}
		try {
			const data = {
				name: file.name + '.' + file.mime,
				size: file.size,
				timestamp: file.timestamp,
				coachId: file.id,
				parent: parentId,
				allowedUser: userId ? [userId] : []
			};
			const create = await pb.collection('file').create(data);
			fToPbMap.set(create.coachId, {name: create.name, pbId: create.id});
			logger.debug(`Created ${create.name} ${create.id} ${create.coachId}`);
			if (onProgress) onProgress(++i, total);
		} catch (e) {
			try {
				const record = await pb.collection('file').getFirstListItem(`coachId = ${file.id}`);
				if (record?.id) {
					let nameChanged = file.name + '.' + file.mime != record?.name;
					let dateNew = new Date(file.timestamp.split('.')[0] + '.000Z');
					let dateOld = new Date(record?.timestamp);
					let wasModified = dateNew.getTime() !== dateOld.getTime();
					let sizeChanged = file.size != record?.size;
					let userExists = userId == undefined ? true : record.allowedUser.includes(userId);
					// let parentChanged  = ?
					if (nameChanged || wasModified || sizeChanged || !userExists) {
						const update = await pb.collection('file').update(record.id, {
							name: file.name + '.' + file.mime,
							timestamp: file.timestamp,
							size: file.size,
							allowedUser: userExists ? record.allowedUser : [...record.allowedUser, userId]
						});
						logger.debug(`Updated ${update.name} ${update.id} ${update.coachId}`);
						if (sizeChanged) {
							fToPbMap.set(record.coachId, {pbId: record.id, name: record.name});
							logger.verbose('File size changed');
						} // Update Cache File
						if (onProgress) onProgress(++i, total);
					} else {
						if (onProgress) onProgress(++i, total);
					}
				}
			} catch (e) {
				logger.warn(`Create/Search/Update failed! ${file.name}.${file.mime} ${file.id}`);
				console.error(e);
				if (onProgress) onProgress(++i, total);
			}
		}
	}
	return fToPbMap;
}
