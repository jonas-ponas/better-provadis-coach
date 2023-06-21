import { Router, response } from 'express';
import { PB_PASSWD, PB_URL, PB_USER, client } from '.';
import logger from './logger';
import ICAL, { Event } from 'ical.js';
import { decode } from 'html-entities';
import { getLinksFromHtml as parseHtmlFiles, mergeIcalFiles as parseIcsFiles } from './parser';

const MAX_CACHE_AGE = process.env.MAX_CACHE_AGE ? parseInt(process.env.MAX_CACHE_AGE) : 1 * 24 * 60 * 60 * 1000; // 1 Day

const router = Router();
const cache = new Map<string, { time: number; content: string; files: string }>();
const fileCache = new Map<string, { time: number; content: string }>();

async function getFiles(icalRecord: any, client: any): Promise<{ name: string; content: string }[]> {
	const getFileContent = async (record: any) => {
		if (fileCache.has(record.id)) {
			const cacheHit = fileCache.get(record.id)!;
			if (new Date().getTime() - cacheHit.time < MAX_CACHE_AGE) {
				return {
					name: record.name,
					content: cacheHit.content
				};
			}
		}
		const response = await fetch(client.getFileUrl(record, record.cachedFile));
		const text = await response.text();
		fileCache.set(record.id, { time: new Date().getTime(), content: text });
		return { content: text, name: record.name };
	};
	const filter = icalRecord.fileList.map((v: string) => `name = '${v}.html' || name = '${v}.ics'`).join(' || ');
	const files = await client.collection('file').getFullList({
		filter
	});

	return await Promise.all(files.map((record: any) => getFileContent(record)));
}

router.get('/:id', async (request, response) => {
	const remoteAdress = request.headers['x-real-ip'] ?? request.socket.remoteAddress;
	logger.info(`${remoteAdress} requests ${request.url}`);
	let id = request.params.id;
	if (id.endsWith('.ics')) {
		logger.debug('Ends with .ics, Removing it >:(');
		id = id.replace('.ics', '');
	}
	try {
		const icalRecord = await client.collection('icals').getOne(id);
		logger.debug(JSON.stringify(icalRecord));
		logger.debug(icalRecord.fileList.length);
		if (icalRecord.fileList.length === 0) {
			logger.info(`Responding to ${remoteAdress}: 404`);
			return response.status(404).send();
		}
		if (cache.has(id)) {
			const cacheHit = cache.get(id)!;
			logger.debug(`Cache has id "${id}"`);
			const isTimeValid = new Date().getTime() - cacheHit.time < MAX_CACHE_AGE;
			const isContentValid = icalRecord.fileList.join(',') == cacheHit.files;
			if (isTimeValid && isContentValid) {
				logger.debug(`Cache Hit! ${id}`);
				logger.info(`Responding to ${remoteAdress}: 200 - Content-Lenght: ${cacheHit.content.length}`);
				return response.status(200).contentType('text/calendar').send(cacheHit.content);
			} else {
				logger.debug(
					`Cache invalid! (Validity: ${JSON.stringify({ time: isTimeValid, content: isContentValid })}`
				);
			}
		}
		const t = await getFiles(icalRecord, client);
		logger.info(`Merging the following files: ${t.map(v => v.name).join(', ')}`);
		const links = parseHtmlFiles(t.filter(v => v.name.endsWith('html')).map(v => v.content));
		const icsFiles = t.filter(v => v.name.endsWith('ics'));
		const combinedIcs = parseIcsFiles(icsFiles, links);
		cache.set(id, { time: new Date().getTime(), content: combinedIcs, files: icalRecord.fileList.join(',') });
		logger.info(`Responding to ${remoteAdress}: 200 - Content-Lenght: ${combinedIcs.length}`);
		response.status(200).contentType('text/calendar').send(combinedIcs);
	} catch (e: any) {
		if (e.stack) {
			logger.error(e.stack);
		}
		if (e.status && e.stack) {
			if (e.status === 401) {
				logger.error('Possibly wrong PocketBase Credentials! Please check!');
				logger.error(e.stack);
				logger.info(`Responding to ${remoteAdress}: 500`);
				return response.status(500).send();
			}
			if (e.status === 404) {
				logger.warn(`Could not find id "${id}"`);
				logger.info(`Responding to ${remoteAdress}: 404 `);
				return response.status(404).send();
			}
		} else {
			logger.error(e);
			logger.info(`Responding to ${remoteAdress}: 500`);
			return response.status(500).send();
		}
	}
});

export default router;
