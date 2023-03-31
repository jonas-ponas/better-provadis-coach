import { Router, response } from 'express';
const PocketBase = require('pocketbase/cjs');
import { PB_PASSWD, PB_URL, PB_USER } from '.';
import logger from './logger';
import ICAL, { Event } from 'ical.js';
import { decode } from 'html-entities';
import { getLinksFromHtml as parseHtmlFiles, mergeIcalFiles as parseIcsFiles } from './parser';

const MAX_CACHE_AGE = 30 * 60 * 1000;

const router = Router();
const cache = new Map<string, { time: number; content: string }>();
const fileCache = new Map<string, { time: number; content: string }>();

async function getFiles(id: string, client: any): Promise<{ name: string; content: string }[]> {
	const getFileContent = async (record: any) => {
		if (fileCache.has(record.id)) {
			const cacheHit = fileCache.get(record.id)!;
			if (new Date().getTime() - cacheHit.time < MAX_CACHE_AGE) return cacheHit;
		}
		const response = await fetch(client.getFileUrl(record, record.cachedFile));
		const text = await response.text();
		cache.set(record.name, { time: new Date().getTime(), content: text });
		return { content: text, name: record.name };
	};

	const icalRecord = await client.collection('icals').getOne(id);

	const filter = icalRecord.fileList.map((v: string) => `name = '${v}.html' || name = '${v}.ics'`).join(' || ');
	const files = await client.collection('file').getFullList({
		filter
	});

	return await Promise.all(files.map((record: any) => getFileContent(record)));
}

router.get('/:id', async (request, response) => {
	const remoteAdress = request.headers['x-real-ip'] ?? request.socket.remoteAddress;
	logger.info(`${remoteAdress} requests ${request.url}`);

	const id = request.params.id;
	const client = new PocketBase(PB_URL);
	try {
		if (cache.has(id)) {
			const cacheHit = cache.get(id)!;
			if (new Date().getTime() - cacheHit.time < MAX_CACHE_AGE)
				return response.status(200).contentType('text/calendar').send(cacheHit.content);
		}
		await client.admins.authWithPassword(PB_USER, PB_PASSWD);
		const t = await getFiles(id, client);
		logger.debug(t.map(v => v.name).join(', '));
		const links = parseHtmlFiles(t.filter(v => v.name.endsWith('html')).map(v => v.content));
		const icsFiles = t.filter(v => v.name.endsWith('ics'));
		const combinedIcs = parseIcsFiles(icsFiles, links);
		cache.set(id, { time: new Date().getTime(), content: combinedIcs });
		response.status(200).contentType('text/calendar').send(combinedIcs);
	} catch (e: any) {
		if (e.stack) {
			logger.error(e.stack);
		}
		if (e.status && e.stack) {
			if (e.status === 401) {
				logger.error('Possibly wrong PocketBase Credentials! Please check!');
				logger.error(e.stack);
				response.status(500).send();
			}
			if (e.status === 404) {
				logger.warn(`Could not find id "${id}"`);
				response.status(404).send();
			}
		} else {
			logger.error(e);
			response.status(500).send();
		}
	}
});

export default router;
