import {NewsItem} from '../coach/Coach';
import logger from '../logger';

export default async function insertNewsItems(
	newsItems: NewsItem[],
	pb: any,
	userId?: string,
	onProgress?: (i: number, t: number) => void
) {
	if (!pb.authStore.isValid) throw Error('Pocketbase-AuthStore not valid');
	const total = newsItems.length;
	let i = 0;
	logger.debug(`userId: ${userId}`);
	for (const item of newsItems) {
		try {
			const create = await pb.collection('news').create({
				coachId: item.id,
				title: item.title,
				text: item.text,
				author: item.author,
				dateCreated: item.created,
				allowedUsers: userId ? [userId] : []
			});

			logger.debug(`Created ${create.name} ${create.id} ${create.coachId}`);
			if (onProgress) onProgress(++i, total);
		} catch (e: unknown) {
			try {
				const record = await pb.collection('news').getFirstListItem(`coachId = ${item.id}`);
				if (record?.id) {
					let userExists = userId == undefined ? true : record.allowedUsers.includes(userId);
					if (!userExists) {
						const update = await pb.collection('news').update(record.id, {
							allowedUsers: [...record.allowedUser, userId]
						});
						logger.debug(`Updated ${update.title} ${update.id} ${update.coachId}`);
						if (onProgress) onProgress(++i, total);
					} else {
						if (onProgress) onProgress(++i, total);
					}
				}
			} catch (e) {
				logger.warn(`Search/Update failed (${item.title}, ${item.id}): ${e}`);
				if (onProgress) onProgress(++i, total);
			}
		}
	}
}
