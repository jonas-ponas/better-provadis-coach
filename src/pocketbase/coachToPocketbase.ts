import insertDirectories from './insertDirectories';
import insertFiles from './insertFiles';
import insertCacheFiles from './insertCacheFiles';
import insertNewsItems from './insertNewsItems';

const coachToPocketbase = {
	insertDirectories,
	insertFiles,
	insertCacheFiles,
	insertNewsItems
};
export default coachToPocketbase;
