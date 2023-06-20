import PocketBase from 'pocketbase/cjs';
import { ENV } from '.';
import logger from './logger';

/**
 * Checks the validity of a provided token for a specified user
 */
export async function checkPocketbaseToken(userId: string, token: string): Promise<boolean> {
	const url = `${
		ENV.PB_URL?.endsWith('/') ? ENV.PB_URL.slice(0, ENV.PB_URL.length - 1) : ENV.PB_URL
	}/api/collections/users/records/${userId}`;
	try {
		logger.debug(`Calling "${url}" with token "${token}"`);
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: token
			},
			redirect: 'follow'
		});
		logger.debug(JSON.stringify(response));
		if (response.status == 200) {
			logger.debug(`${userId} has valid token (${token})!`);
			return true;
		} else {
			logger.warn(`PocketBase returned ${response.status}: ${response.statusText}`);
			return false;
		}
	} catch (e: unknown) {
		if (e instanceof Error) {
			logger.error(e);
		}
		return false;
	}
}
/**
 * Gets the Admin-PocketBase-Client
 */
export async function getLoggedInClient(): Promise<PocketBase> {
	const client = new PocketBase(ENV.PB_URL);
	await client.admins.authWithPassword(ENV.PB_USER, ENV.PB_PASSWD);
	return client;
}
