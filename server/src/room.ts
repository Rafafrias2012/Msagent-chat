import { Client } from "./client.js";

export class MSAgentChatRoom {
    clients: Client[];

    constructor() {
        this.clients = [];
    }

    addClient(client: Client) {
        this.clients.push(client);
        client.on('close', () => {
            this.clients.splice(this.clients.indexOf(client), 1);
        });
    }
}