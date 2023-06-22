import { FileRecord, FileResponse } from '../pocketbase-types';
import { File } from '../coach/Coach';
import logger from '../logger';

export type ModifiedFile = {
	record: FileResponse;
	coach: File;
};

type FileDiffResult = {
	added?: File[];
	removed?: FileResponse[];
	modified?: ModifiedFile[];
};

export function fileDiff(input: { current: FileResponse[]; incoming: File[]; userId?: string }): FileDiffResult {
	let current = new Map(input.current.map(f => [f.coachId, f]));
	let incoming = new Map(input.incoming.map(f => [f.id, f]));

	const added = Array.from(incoming.values()).filter(obj => !Array.from(current.keys()).includes(obj.id));
	const removed = Array.from(current.values()).filter(obj => !Array.from(incoming.keys()).includes(obj.coachId));
	const modified: ModifiedFile[] = [];

	current.forEach(file => {
		if (removed.findIndex(({ coachId }) => file.coachId === coachId) === -1) {
			const incomingFile = incoming.get(file.coachId) as File;
			if (incomingFile) {
				let dateNew = new Date(incomingFile.timestamp.split('.')[0] + '.000Z');
				let dateOld = new Date(file?.timestamp);
				let wasModified = dateNew.getTime() !== dateOld.getTime();

				const sizeChanged = incomingFile.size !== file.size;
				let nameChanged = incomingFile.name + '.' + incomingFile.mime != file?.name;
				if (sizeChanged || nameChanged || wasModified) {
					modified.push({
						record: file,
						coach: incomingFile
					});
				}
			}
		}
	});

	return {
		added,
		removed,
		modified
	};
}

export function seperateFilesToInsertFromFilesToGrant(
	{ added: fullAdded }: FileDiffResult,
	{ added: userAdded }: FileDiffResult,
	currentFiles: FileResponse[]
): { filesToGrant: FileResponse[]; filesToInsert: File[] } {
	const filesToGrant: FileResponse[] = [];
	const filesToInsert: FileDiffResult['added'] = [];

	userAdded?.forEach(userFile => {
		if (fullAdded?.findIndex(fullFile => fullFile.id === userFile.id) === -1) {
			const fileRecord = currentFiles.find(v => v.coachId === userFile.id);
			if (fileRecord) filesToGrant.push(fileRecord);
		} else {
			filesToInsert.push(userFile);
		}
	});
	return { filesToInsert, filesToGrant };
}
