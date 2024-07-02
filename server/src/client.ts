import EventEmitter from "events";
import { WebSocket } from "ws";
import { MSAgentProtocolMessage, MSAgentProtocolMessageType } from '@msagent-chat/protocol';
import { MSAgentChatRoom } from "./room.js";

export class Client extends EventEmitter {
    username: string | null;
    room: MSAgentChatRoom;
    socket: WebSocket;
    constructor(socket: WebSocket, room: MSAgentChatRoom) {
        super();
        this.socket = socket;
        this.room = room;
        this.username = null;
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

                break;
            }
            case MSAgentProtocolMessageType.Talk: {

                break;
            }
        }
    }
}