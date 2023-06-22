import { directoryDiff } from '../src/sync/dirDiff';

import { Directory } from '../src/coach/Coach';
import { DirectoryResponse } from '../src/pocketbase-types';

import currentDirectories from './res/curDirectories.json';
import incomingDirectories from './res/incDirectories.json';

const DIFF_DATA = {
	EMPTY_CURRENT: [] as DirectoryResponse[],
	EMPTY_INCOMING: [] as Directory[],
	CURRENT: currentDirectories as DirectoryResponse[],
	INCOMING: incomingDirectories as Directory[]
};

describe('DirectoryDiff', () => {
	test('Empty Incoming & Current', () => {
		expect(
			directoryDiff({
				incoming: DIFF_DATA.EMPTY_INCOMING,
				current: DIFF_DATA.EMPTY_CURRENT
			})
		).toMatchObject({
			added: [],
			removed: []
		});
	});

	test('Empty Incoming, but current', () => {
		const diffResult = directoryDiff({ incoming: DIFF_DATA.EMPTY_INCOMING, current: DIFF_DATA.CURRENT });
		expect(diffResult.removed?.length).toBe(DIFF_DATA.CURRENT.length); // 30
		expect(diffResult.added?.length).toBe(0);
	});

	test('Empty current, but incoming', () => {
		const diffResult = directoryDiff({ incoming: DIFF_DATA.INCOMING, current: DIFF_DATA.EMPTY_CURRENT });
		expect(diffResult.removed?.length).toBe(0); // 30
		expect(diffResult.added?.length).toBe(DIFF_DATA.INCOMING.length);
	});

	test('Current + Incoming both full', () => {
		const diffResult = directoryDiff({ incoming: DIFF_DATA.INCOMING, current: DIFF_DATA.CURRENT });
		expect(diffResult.removed?.length).toBe(DIFF_DATA.CURRENT.length); // 30
		expect(diffResult.added?.length).toBe(DIFF_DATA.INCOMING.length);
	});
});
