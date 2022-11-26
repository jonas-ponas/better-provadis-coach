import Coach from './Coach'
import dotenv from 'dotenv';
import { writeFile } from 'fs'
dotenv.config()

const data = {
    token: {
        token: process.env.ACCESS_TOKEN||"",
        expires: new Date(Date.now() - 1800).toISOString() // Force to get a new token immedeatly
    },
    refreshToken: process.env.REFRESH_TOKEN||""
}
let coach: Coach = new Coach(data)

async function main() {
    const data = await coach.getFiles()
    console.log(data)
}

main().then(() => {

}).catch((e: Error) => {
    console.log("### ! ### Failed ### ! ###\n", e.message)

}).finally(() => {
    const token = coach.dumpCurrentRefreshToken()||""
    console.log("Current Refresh-Token: " + token)
    writeFile('./data/token', Buffer.from(token, 'utf-8'), () => {
        console.log("Dumped current Refresh-Token")
    })
})