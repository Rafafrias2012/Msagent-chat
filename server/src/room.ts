import { MSAgentAddUserMessage, MSAgentChatMessage, MSAgentInitMessage, MSAgentProtocolMessage, MSAgentProtocolMessageType, MSAgentRemoveUserMessage } from "@msagent-chat/protocol";
import { Client } from "./client.js";
import { TTSClient } from "./tts.js";

export class MSAgentChatRoom {
    clients: Client[];
    tts: TTSClient | null;
    msgId : number = 0;
    constructor(tts: TTSClient | null) {
        this.clients = [];
        this.tts = tts;
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
            let initmsg : MSAgentInitMessage = {
                op: MSAgentProtocolMessageType.Init,
                data: {
                    username: client.username!,
                    agent: client.agent!,
                    users: this.clients.filter(c => c.username !== null).map(c => {
                        return {
                            username: c.username!,
                            agent: c.agent!
                        }
                    })
                }
            };
            client.send(initmsg);
            let msg: MSAgentAddUserMessage = {
                op: MSAgentProtocolMessageType.AddUser,
                data: {
                    username: client.username!,
                    agent: client.agent!
                }
            }
            for (const _client of this.getActiveClients().filter(c => c !== client)) {
                _client.send(msg);
            }
        });
        client.on('talk', async message => {
            let msg: MSAgentChatMessage = {
                op: MSAgentProtocolMessageType.Chat,
                data: {
                    username: client.username!,
                    message
                }
            };
            if (this.tts !== null) {
                let filename = await this.tts.synthesizeToFile(message, (++this.msgId).toString(10));
                msg.data.audio = "/api/tts/" + filename;
            }
            for (const _client of this.getActiveClients()) {
                _client.send(msg);
            }
        });
    }

    private getActiveClients() {
        return this.clients.filter(c => c.username !== null);
    }
}