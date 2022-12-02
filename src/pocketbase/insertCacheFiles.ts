import {Coach, File} from '../coach/Coach';
// import pocketbaseEs from "pocketbase"

export default async function insertCacheFiles(
	pb: any,
	coach: Coach,
	fToPbMap: Map<number, {pbId: string; name: string}>,
	onProgress?: (i: number, t: number) => void
) {
	if (!pb.authStore.isValid) throw Error('Pocketbase-AuthStore not valid');
	console.log(fToPbMap);
	const total = fToPbMap.size;
    let i = 0;
	for (const [coachId, {pbId, name}] of fToPbMap) {
		let blob;
		try {
			// console.log('Buffering File...', pbId)
			blob = await coach.getFileContents(coachId);
		} catch (e) {
			console.log('Failed download from Coach', name);
			console.error(e);
			continue
		}
		try {
			console.log('Uploading File...', name, pbId);
			const formData = new FormData();
			formData.append('cachedFile', blob, name);

			const response = await pb.collection('file').update(pbId, formData);
			// console.log(response)
			console.log('done', name);
			if(onProgress) onProgress(++i, total);
		} catch (e) {
			console.log('Failed upload ', name, pbId);
			console.error(e);
            if(onProgress) onProgress(++i, total);
			continue
		}
	}
}
