import express from 'express';
import router from './router';
import dotenv from 'dotenv';
import logger from './logger';
const PocketBase = require('pocketbase/cjs');

dotenv.config();
export const PB_USER = process.env.PB_USER ?? '';
export const PB_PASSWD = process.env.PB_PASSWD ?? '';
export const PB_URL = process.env.PB_URL ?? '';
const BASENAME = process.env.BASENAME ?? '/';
const PORT = process.env.PORT ?? 8080;

if (PB_PASSWD === '' || PB_USER === '' || PB_URL === '') {
	logger.error('PocketBase Service User Credentials Missing. Check Environment Variables!');
	process.exit(1);
}

export const client = new PocketBase(PB_URL);
client.admins
	.authWithPassword(PB_USER, PB_PASSWD)
	.then(() => {
		logger.info(`Service-User is logged in!`);
	})
	.catch((e: unknown) => {
		logger.error('Could not login Service-User. Check Credentials!');
		if (e instanceof Error) {
			logger.error(`${e.name}\n${e.stack}`);
		}
		process.exit(1);
	});

const app = express();
app.use(BASENAME, router);
app.set('x-powered-by', false);
app.listen(PORT, () => {
	logger.info(`Listening on ${PORT} on path ${BASENAME}`);
});
