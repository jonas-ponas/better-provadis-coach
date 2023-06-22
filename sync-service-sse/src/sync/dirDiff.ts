import { Directory } from '../coach/Coach';
import logger from '../logger';
import { DirectoryResponse } from '../pocketbase-types';

type DirectoryDiffResult = {
	added?: Directory[];
	removed?: DirectoryResponse[];
};

export function directoryDiff(input: { current: DirectoryResponse[]; incoming: Directory[] }): DirectoryDiffResult {
	let current = new Map(input.current.map(d => [d.coachId, d]));
	let incoming = new Map(input.incoming.map(d => [d.id, d]));

	const currentValues = Array.from(current.values());
	const incomingValues = Array.from(incoming.values());

	logger.verbose(`current: ${currentValues.length} ${incomingValues.length}`);
	const added = incomingValues.filter(obj => !Array.from(current.keys()).includes(obj.id));
	const removed = currentValues.filter(obj => !Array.from(incoming.keys()).includes(obj.coachId));
	return {
		added,
		removed
	};
}

export function sortDirectoriesByHirarchy(dirs: Directory[]): Directory[] {
	const ids = dirs.map(d => d.id);
	const sortedDirs: Directory[] = [];

	dirs.forEach((dir, idx, arr) => {
		if (ids.includes(dir.parent_id)) {
			if (sortedDirs.find(d => d.id === dir.parent_id)) {
				sortedDirs.push(dir);
			} else {
				arr.push(...arr.splice(idx, 1));
			}
		} else {
			sortedDirs.push(dir);
		}
	});

	return sortedDirs;
}
