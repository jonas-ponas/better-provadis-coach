import {WebSocketServer, WebSocket, RawData} from "ws";
import handleInit from "./handlers/handleInit";
import handleLogin from "./handlers/handleLogin";
import handleSync from "./handlers/handleSync";
import dotenv from 'dotenv'
import logger from "./logger";
dotenv.config()

export const PB_USER = process.env.PB_USER;
export const PB_PASSWD = process.env.PB_PASSWD;

if (!PB_PASSWD || !PB_USER) {
	logger.error('PocketBase Service User Credentials Missing. Check Environment Variables!');
	process.exit(1);
}

const PORT = (parseInt(process.env.PORT||"8080"))

const wss = new WebSocketServer({
    port: PORT
})

type Handler = (client: MyWebSocket, data: {[key: string]: any})=>void

export interface MyWebSocket extends WebSocket {
    remoteAdress: string
    isAuthorized: boolean
    userId: any
}

const handlers: {[key: string]: Handler} = {
    "init": handleInit,
    "sync": handleSync,
    "login": handleLogin
}

function handleMessage(client: MyWebSocket) {
    return function(data: RawData, isBinary: boolean) {
        let json
        try {
            json = JSON.parse(data.toString('utf8'))
            if(json.type && Object.keys(handlers).includes(json.type)) {
                logger.log('verbose', 'Incoming ' + JSON.stringify(json))
                return handlers[json.type](client, json)
            }
            return client.send(JSON.stringify({type: 'error', msg:'Unknown message type.'}))
        } catch(e) {
            logger.log('warn', 'Unsupported Data: ' + data.toString('utf-8'))
            client.close(1003, "Unsupported Data")
            client.send(JSON.stringify({type: 'error', msg: 'Provide JSON.'}))
            return
        }
    
    }
}

wss.on('listening', () => {
    logger.log('info', `Websocket listening running on port ${PORT}`)
})

wss.on('connection', (client: MyWebSocket, request) => {
    logger.log('info', `Client ${request.socket.remoteAddress} connected`)
    
    client.isAuthorized = false
    client.remoteAdress = request.socket.remoteAddress||'none'
    setTimeout(() => {
        if(!client.isAuthorized) {
            logger.log('info', `Client ${request.socket.remoteAddress} did not authorize in time`)
            client.close(3000, "Login Timeout")
        }
    }, 10 * 1000) 

    client.on('message', handleMessage(client))

    client.on('close', () => {
        logger.log('info', `Client ${request.socket.remoteAddress} disconnected`)
    })
})

wss.on('error', (error) => {
    logger.log('error', error)
})