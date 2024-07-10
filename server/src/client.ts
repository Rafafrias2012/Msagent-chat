import EventEmitter from "events";
import { WebSocket } from "ws";
import { MSAgentJoinMessage, MSAgentProtocolMessage, MSAgentProtocolMessageType, MSAgentTalkMessage } from '@msagent-chat/protocol';
import { MSAgentChatRoom } from "./room.js";
import * as htmlentities from 'html-entities';

// Event types

export interface Client {
    on(event: 'join', listener: () => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'talk', listener: (msg: string) => void): this;

    on(event: string, listener: Function): this;
}

export class Client extends EventEmitter {
    username: string | null;
    agent: string | null;

    room: MSAgentChatRoom;
    socket: WebSocket;
    constructor(socket: WebSocket, room: MSAgentChatRoom) {
        super();
        this.socket = socket;
        this.room = room;
        this.username = null;
        this.agent = null;
        this.socket.on('message', (msg, isBinary) => {
            if (isBinary) {
                this.socket.close();
                return;
            }
            this.parseMessage(msg.toString("utf-8"));
        });
        this.socket.on('error', () => {});
        this.socket.on('close', () => {
            this.emit('close');
        });
    }

    send(msg: MSAgentProtocolMessage) {
        return new Promise<void>((res, rej) => {
            if (this.socket.readyState !== WebSocket.OPEN) {
                res();
                return;
            }
            this.socket.send(JSON.stringify(msg), err => {
                if (err) {
                    rej(err);
                    return;
                }
                res();
            });
        });
    }

    private parseMessage(data: string) {
        let msg: MSAgentProtocolMessage;
        try {
            msg = JSON.parse(data);
        } catch {
            this.socket.close();
            return;
        }
        switch (msg.op) {
            case MSAgentProtocolMessageType.Join: {
                let joinMsg = msg as MSAgentJoinMessage;
                if (!joinMsg.data || !joinMsg.data.username || !joinMsg.data.username) {
                    this.socket.close();
                    return;
                }
                let username = htmlentities.encode(joinMsg.data.username);
                if (this.room.clients.some(u => u.username === username)) {
                    let i = 1;
                    let uo = username;
                    do {
                        username = uo + i++;
                    } while (this.room.clients.some(u => u.username === username))
                }
                if (!this.room.agents.some(a => a.filename === joinMsg.data.agent)) {
                    this.socket.close();
                    return;
                }
                this.username = username;
                this.agent = joinMsg.data.agent;
                this.emit('join');
                break;
            }
            case MSAgentProtocolMessageType.Talk: {
                let talkMsg = msg as MSAgentTalkMessage;
                if (!talkMsg.data || !talkMsg.data.msg) {
                    return;
                }
                if (talkMsg.data.msg.length > this.room.config.charlimit) return;
                this.emit('talk', talkMsg.data.msg);
                break;
            }
        }
    }
}