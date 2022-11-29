// import pocketbaseEs, { ClientResponseError } from "pocketbase";
import { Directory } from "../coach/Coach";


export default async function insertDirectories(directories: Directory[], pb: any, userId?: string, cToPbMap?: Map<number, string>) {
    cToPbMap = cToPbMap||(new Map<number, string>())
    const updateDirs: Directory[] = []
    if(!pb.authStore.isValid) throw Error('Pocketbase-AuthStore not valid')

    for(const directory of directories) {
        try {
            const create = await pb.collection('directory').create({
                name: directory.name,
                timestamp: directory.modified.timestamp,
                coachId: directory.id,
                allowedUser: userId ? [userId] : [],
            })
            cToPbMap.set(directory.id, create.id)
            updateDirs.push(directory)
            console.log('Created', create.name, create.id, create.coachId)
        } catch(e: any) {
            try {
                const record = await pb.collection('directory').getFirstListItem(`coachId = ${directory.id}`)
                if(record?.id) {
                    cToPbMap.set(record.coachId, record.id)
                    let nameChanged = directory.name != record?.name
                    let wasModified = (new Date(directory.modified.timestamp).getTime()) != (new Date(record?.timestamp).getTime())
                    let userExists = userId == undefined ? true : record.allowedUser.includes(userId)
                    if(nameChanged || wasModified || !(userExists)) {
                        const update = await pb.collection('directory').update(record.id, {
                            name: directory.name,
                            timestamp: directory.modified.timestamp,
                            allowedUser: userExists ? record.allowedUser : [...record.allowedUser, userId]
                        })
                        console.log("Updated", update.name, update.id, update.coachId)
                    } else {
                        console.log("No update neccessary", record.name, record.id, record.coachId)
                    }
                }
            } catch(e) {
                console.log("Search/Update failed!", directory.name, directory.id)
            }
        }
    }

    for(const directory of updateDirs) {
        let parentId = cToPbMap.get(directory.parent_id)
        const id = cToPbMap.get(directory.id)
        if(!parentId) {
            try {
                const record = pb.collection('directory').getFirstListItem(`coachId = ${directory.id}`)
                if(record?.id) {
                    parentId = record.id
                } else {
                    console.log('Cannot find parent', directory.parent_id, 'for', directory.name, directory.id)  
                    continue
                }
            } catch(e) {
                console.log('Failed find parent', directory.parent_id, 'for', directory.name, directory.id)  
                continue
            }
        } 
        try {
            const update = await pb.collection('directory').update(id, {
                parent: parentId
            })
            console.log("Updated Parent for", update.name, update.id)
        } catch(e) {
            console.log('Failed to update', directory.name, directory.id)
        }
    }
    return cToPbMap
}