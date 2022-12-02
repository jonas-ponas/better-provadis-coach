import {WebSocketServer, WebSocket, RawData} from "ws";
import handleInit from "./handlers/handleInit";
import handleLogin from "./handlers/handleLogin";
import handleSync from "./handlers/handleSync";
import dotenv from 'dotenv'
dotenv.config()

export const PB_USER = process.env.PB_USER;
export const PB_PASSWD = process.env.PB_PASSWD;

const wss = new WebSocketServer({
    port: 8080
})

type Handler = (client: MyWebSocket, data: {[key: string]: any})=>void

export interface MyWebSocket extends WebSocket {
    [key: string]: any
}

const handlers: {[key: string]: Handler} = {
    "init": handleInit,
    "sync": handleSync,
    "login": handleLogin
}

const clients = new Map<string, {isAuthenticated: boolean}>()

function handleMessage(client: MyWebSocket) {
    return function(data: RawData, isBinary: boolean) {
        let json
        try {
            json = JSON.parse(data.toString('utf8'))
            if(json.type && Object.keys(handlers).includes(json.type)) {
                return handlers[json.type](client, json)
            }
            return client.send(JSON.stringify({type: 'error', msg:'Unknown message type.'}))
        } catch(e) {
            client.close(1003, "Unsupported Data")
            client.send(JSON.stringify({type: 'error', msg: 'Provide JSON.'}))
            return
        }
    
    }
}

wss.on('connection', (client: MyWebSocket, request) => {
    console.log('client connected')
    
    client.isAuthorized = false
    setTimeout(() => {
        if(!client.isAuthorized) client.close(3000, "Login Timeout")
    }, 10 * 1000) 

    client.on('message', handleMessage(client))

    client.on('close', () => {
        console.log('client disconnected')
    })
})

console.log('Websocket running on port 8080')