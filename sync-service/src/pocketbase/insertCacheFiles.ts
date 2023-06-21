import { Coach, File } from '../coach/Coach';
import logger from '../logger';
// import pocketbaseEs from "pocketbase"

export default async function insertCacheFiles(
	pb: any,
	coach: Coach,
	fToPbMap: Map<number, { pbId: string; name: string }>,
	onProgress?: (i: number, t: number) => void
) {
	if (!pb.authStore.isValid) throw Error('Pocketbase-AuthStore not valid');
	logger.debug(`Cache-Files to Update: ${fToPbMap.size}`);
	const total = fToPbMap.size;
	let i = 0;
	for (const [coachId, { pbId, name }] of fToPbMap) {
		let blob;
		try {
			blob = await coach.getFileContents(coachId);
		} catch (e) {
			logger.warn(`Failed download from Coach ${name}. ${e}`);
			continue;
		}
		try {
			const formData = new FormData();
			formData.append('cachedFile', blob, name);

			const response = await pb.collection('file').update(pbId, formData);
			logger.debug(`Uploaded file ${name}`);
			if (onProgress) onProgress(++i, total);
		} catch (e) {
			logger.warn(`Failed upload ${name} ${pbId} ${e}`);
			if (onProgress) onProgress(++i, total);
			continue;
		}
	}
}
