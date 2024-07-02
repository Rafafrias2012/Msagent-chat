import EventEmitter from "events";
import { WebSocket } from "ws";

export class Client extends EventEmitter {
    username: string | null;
    socket: WebSocket;
    constructor(socket: WebSocket) {
        super();
        this.socket = socket;
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

    private parseMessage(msg: string) {

    }
}