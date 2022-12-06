import pocketbaseEs from "pocketbase";
import { Coach } from "../coach/Coach";
import coachToPocketbase from "../pocketbase/coachToPocketbase";
import { MyWebSocket, PB_PASSWD, PB_USER } from "../server";
const PocketBase = require('pocketbase/cjs')

export default function handleSync(client: MyWebSocket, data: {[key: string]: any}) {
    if(!client.isAuthorized || !client.userId) {
        client.send(JSON.stringify({type: 'error', msg: 'Unauthorized'}))
        return
    }
    if(!PB_USER || !PB_PASSWD) {
        client.send(JSON.stringify({type: 'error', msg: 'Internal Error (S1)'})) // ERROR S1
        client.close(1011, "Internal Error")
        return
    }
    client.send(JSON.stringify({type:'progress', phase: 'auth'}))
    const pb: pocketbaseEs = new PocketBase('https://coach.***REMOVED***/');
    pb.admins.authWithPassword(PB_USER, PB_PASSWD).then(async (value) => {
        client.send(JSON.stringify({type:'progress', phase: 'state'}))
        const state = await pb.collection('state').getFirstListItem(`user.id = "${client.userId}"`)
        client.send(JSON.stringify({type: 'progress', phase: 'coach', step: 1}))
        const coach = await Coach.createFromState({
			token: state.token,
			expires: new Date(state.expires).getTime(),
			refreshToken: state.refreshToken,
			url: state.url,
			domainId: state.domainId,
			clientId: process.env.CLIENT_ID || '',
			clientSecret: process.env.CLIENT_SECRET || ''
		})
        client.send(JSON.stringify({type: 'progress', phase: 'coach', step: 2}))
        let success = false
        let username
        try {
            const user = await coach.getUserInfo()
            client.send(JSON.stringify({type: 'progress', phase: 'coach', step: 3}))
            console.log('Syncing Files for: ', [user.user.firstname, user.user.familyname].join(' '))
            username = user.user.firstname+" "+user.user.familyname;
            const dirs = await coach.getDirectories()
            client.send(JSON.stringify({type: 'progress', phase: 'coach', step: 4}))
            const files = await coach.getFiles()
            client.send(JSON.stringify({type: 'progress', phase: 'database', step: 1}))
            const ctoPb = await coachToPocketbase.insertDirectories(dirs, pb, state.user, new Map(), (i, t) => {
                client.send(JSON.stringify({type: 'progress', phase: 'database', step: 1, detail: i, total: t}))
            });
            client.send(JSON.stringify({type: 'progress', phase: 'database', step: 2}))
            const fToPb = await coachToPocketbase.insertFiles(files, pb, state.user, ctoPb, (i, t) => {
                client.send(JSON.stringify({type: 'progress', phase: 'database', step: 2, detail: i, total: t}))
            })
            client.send(JSON.stringify({type: 'progress', phase: 'database', step: 3}))
            await coachToPocketbase.insertCacheFiles(pb, coach, fToPb, (i, t) => {
                client.send(JSON.stringify({type: 'progress', phase: 'database', step: 3, detail: i, total: t}))
            })
        } catch(e) {
            console.error(e)
            client.send(JSON.stringify({type: 'error', msg: 'Internal Error (S3)'})) // ERROR S3
            client.close(1011)
        } finally {
            const currentState = coach.exportFromState();
			const data: any = {
				refreshToken: currentState.refreshToken,
				token: currentState.token,
				expires: new Date((currentState.expires||0)).toISOString(),
				url: currentState.url,
				coachUserId: currentState.userId,	
                lastSync: success ? new Date().toISOString : state.lastSync,
                coachUsername: username||state.coachUsername
			}
			if(success) data.lastSync = new Date().toISOString()
			console.log(data)
			await pb.collection('state').update(state.id, data);
			client.send(JSON.stringify({type: 'progress', phase: 'done', withError: !success}))
        }
    }).catch((e) => {
        console.error(e)
        client.send(JSON.stringify({type: 'error', msg: 'Internal Error (S2)'})) // ERROR S2
        client.close(1011)
    })
}