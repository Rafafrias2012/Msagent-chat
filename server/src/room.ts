import { MSAgentAddUserMessage, MSAgentInitMessage, MSAgentProtocolMessage, MSAgentProtocolMessageType, MSAgentRemoveUserMessage } from "@msagent-chat/protocol";
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
            if (client.username === null) return;
            let msg: MSAgentRemoveUserMessage = {
                op: MSAgentProtocolMessageType.RemoveUser,
                data: {
                    username: client.username
                }
            };
            for (const _client of this.getActiveClients()) {
                _client.send(msg);
            }
        });
        client.on('join', () => {
            client.send(this.getInitMsg());
            let msg: MSAgentAddUserMessage = {
                op: MSAgentProtocolMessageType.AddUser,
                data: {
                    username: client.username!
                }
            }
            for (const _client of this.getActiveClients().filter(c => c !== client)) {
                _client.send(msg);
            }
        });
    }

    private getInitMsg(): MSAgentInitMessage {
        return {
            op: MSAgentProtocolMessageType.Init,
            data: {
                users: this.clients.filter(c => c.username !== null).map(c => c.username!)
            }
        }
    }

    private getActiveClients() {
        return this.clients.filter(c => c.username !== null);
    }
}