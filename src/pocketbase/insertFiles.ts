import { File } from "../coach/Coach"
// import pocketbaseEs from "pocketbase"

export default async function insertFiles(files: File[], pb: any, userId?: string, cToPbMap?: Map<number, string>) {
    cToPbMap = cToPbMap||(new Map<number, string>())
    if(!pb.authStore.isValid) throw Error('Pocketbase-AuthStore not valid')

    for(const file of files) {
        let parentId = cToPbMap.get(file.directory.id)
        if(!parentId) {
            try {
                const record = await pb.collection('directory').getFirstListItem(`coachId=${file.directory.id}`)
                parentId = record.id
            } catch(e) {
                console.log('Cannot find parent', file.directory.name, file.directory.id,'for', file.name, file.id)
                continue
            }
        }
        try {
            const data = {
                name: file.name + "." + file.mime,
                size: file.size,
                timestamp: file.timestamp,
                coachId: file.id,
                parent: parentId,
                allowedUser: userId ? [userId] : [] 
            }
            // console.log(data)
            const create = await pb.collection('file').create(data)
            console.log('Created', create.name, create.id, create.coachId)
        } catch(e) {
            try {
                const record = await pb.collection('file').getFirstListItem(`coachId = ${file.id}`)
                if(record?.id) {
                    let nameChanged = file.name != record?.name
                    let wasModified = (new Date(file.timestamp).getTime()) != (new Date(record?.timestamp).getTime())
                    let sizeChanged = file.size != record?.size
                    let userExists = userId == undefined ? true : record.allowedUser.includes(userId)
                    // let parentChanged  = ? 
                    if(nameChanged || wasModified || sizeChanged || (!userExists)) {
                        const update = await pb.collection('file').update(record.id, {
                            name: file.name,
                            timestamp: file.timestamp,
                            size: file.size,
                            allowedUser: userExists ? record.allowedUser : [...record.allowedUser, userId]
                        })
                        console.log('Updated', update.name, update.id, update.coachId)
                    } else {
                        console.log('No update neccessary', record.name, record.id, record.coachId)
                    }
                }
            } catch(e) {
                console.log("Create/Search/Update failed!", file.name, file.id)
                console.error(e)
            }
        }
    }
}