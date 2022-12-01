import {Coach} from './coach/Coach';
import coachToPocketbase from './pocketbase/coachToPocketbase';
const PocketBase = require('pocketbase/cjs');
import dotenv from 'dotenv';
dotenv.config();

const USERNAME = process.env.USERNAME;
if(!USERNAME) {
	console.log("No user specified")
	process.exit(1)
}

const PB_USER = process.env.PB_USER || '';
const PB_PASSWD = process.env.PB_PASSWD || '';

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
			const dirs = await await coach.getDirectories();
			const ctoPb = await coachToPocketbase.insertDirectories(dirs, pb, user.id);

			// Insert Files
			const files = await await coach.getFiles();
			await coachToPocketbase.insertFiles(files, pb, user.id);
			success = true
		} catch (e) {
			console.log(e);
		} finally {
			const currentState = coach.exportFromState();
			const data: any = {
				refreshToken: currentState.refreshToken,
				token: currentState.token,
				expires: new Date((currentState.expires || 0)*1000).toISOString(),
				url: currentState.url,
				coachUserId: currentState.userId,	
			}
			console.log(data);
			if(success) data.lastSync = new Date().toISOString()
			const updateResult = await pb.collection('state').update(state.id, data);
			console.log('Wrote State back to PB');
		}
	})
	.catch((e: Error) => {
		console.log('Failed to authenticate');
	});
