import { FileRecord } from '../types';
import { File } from './coach/Coach';
import { SHA1 } from 'crypto-js';
import logger from './logger';

type DiffResult = {
	added?: File[];
	removed?: FileRecord[];
	modified?: File[];
};

export function fileDiff(input: { current: FileRecord[]; incoming: File[]; userId?: string }): DiffResult {
	let current = new Map(input.current.map(f => [f.coachId, f]));
	let incoming = new Map(input.incoming.map(f => [f.id, f]));

	const added = Array.from(incoming.values()).filter(obj => !Array.from(current.keys()).includes(obj.id));
	const removed = Array.from(current.values()).filter(obj => !Array.from(incoming.keys()).includes(obj.coachId));
	const modified: File[] = [];

	console.log();
	current.forEach(file => {
		if (removed.findIndex(({ coachId }) => file.coachId === coachId) === -1) {
			const incomingFile = incoming.get(file.coachId) as File;
			if (incomingFile) {
				let dateNew = new Date(incomingFile.timestamp.split('.')[0] + '.000Z');
				let dateOld = new Date(file?.timestamp);
				let wasModified = dateNew.getTime() !== dateOld.getTime();
				let userExists = input.userId == undefined ? true : file.allowedUser.includes(input.userId);

				const sizeChanged = incomingFile.size !== file.size;
				const timeChanged = incomingFile.timestamp !== file.timestamp;
				let nameChanged = incomingFile.name + '.' + incomingFile.mime != file?.name;
				logger.debug(`${incomingFile.timestamp} ${file.timestamp} ${timeChanged}`);
				if (sizeChanged || nameChanged || wasModified) {
					modified.push(incomingFile);
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
