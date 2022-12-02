import {Coach} from './coach/Coach';
import coachToPocketbase from './pocketbase/coachToPocketbase';
const PocketBase = require('pocketbase/cjs');
import dotenv from 'dotenv';
dotenv.config();

const USERNAME = process.env.USERNAME;
const PB_USER = process.env.PB_USER;
const PB_PASSWD = process.env.PB_PASSWD;
if(!USERNAME || !PB_USER || !PB_PASSWD) {
	console.log("Missing Environment Variables")
	process.exit(1)
}

const pb = new PocketBase('https://coach.***REMOVED***/');
// pb.autoCancellation(false);
pb.admins
	.authWithPassword(PB_USER, PB_PASSWD)
	.then(async () => {
		const user = await pb.collection('users').getFirstListItem('username = "jonas"');
		const state = await pb.collection('state').getFirstListItem(`user.id = "${user.id}"`);
		const coach = await Coach.createFromState({
			token: state.token,
			expires: new Date(state.expires).getTime(),
			refreshToken: state.refreshToken,
			url: state.url,
			domainId: state.domainId,
			clientId: process.env.CLIENT_ID || '',
			clientSecret: process.env.CLIENT_SECRET || ''
		});
		let success = false
		try {
			// console.log(user.id);
			const user = await coach.getUserInfo()
			// Insert Directories
			const dirs = await coach.getDirectories();
			const ctoPb = await coachToPocketbase.insertDirectories(dirs, pb, user.id);
			
			// Insert Files
			const files = await (await coach.getFiles()).slice(400, -1)
			const ftoPb = await coachToPocketbase.insertFiles(files, pb, user.id, ctoPb);

			await coachToPocketbase.insertCacheFiles(pb, coach, ftoPb)

			success = true
		} catch (e) {
			console.log(e);
		} finally {
			const currentState = coach.exportFromState();
			// console.log(currentState)
			const data: any = {
				refreshToken: currentState.refreshToken,
				token: currentState.token,
				expires: new Date((currentState.expires||0)).toISOString(),
				url: currentState.url,
				coachUserId: currentState.userId,	
			}
			if(success) data.lastSync = new Date().toISOString()
			console.log(data)
			const updateResult = await pb.collection('state').update(state.id, data);
			console.log('Wrote State back to PB');
		}
	})
	.catch((e: Error) => {
		console.log('Failed to authenticate');
		console.error(e)
	});
