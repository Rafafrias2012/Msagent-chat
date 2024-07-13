import EventEmitter from "events";
import { WebSocket } from "ws";
import { MSAgentAdminBanMessage, MSAgentAdminGetIPMessage, MSAgentAdminGetIPResponse, MSAgentAdminKickMessage, MSAgentAdminLoginMessage, MSAgentAdminLoginResponse, MSAgentAdminMessage, MSAgentAdminOperation, MSAgentErrorMessage, MSAgentJoinMessage, MSAgentProtocolMessage, MSAgentProtocolMessageType, MSAgentTalkMessage } from '@msagent-chat/protocol';
import { MSAgentChatRoom } from "./room.js";
import * as htmlentities from 'html-entities';
import RateLimiter from "./ratelimiter.js";
import { createHash } from "crypto";

// Event types

export interface Client {
    on(event: 'join', listener: () => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'talk', listener: (msg: string) => void): this;

    on(event: string, listener: Function): this;
}

export class Client extends EventEmitter {
    ip: string;
    username: string | null;
    agent: string | null;
    admin: boolean;

    room: MSAgentChatRoom;
    socket: WebSocket;

    nopTimer: NodeJS.Timeout | undefined;
    nopLevel: number;

    chatRateLimit: RateLimiter

    constructor(socket: WebSocket, room: MSAgentChatRoom, ip: string) {
        super();
        this.socket = socket;
        this.ip = ip;
        this.room = room;
        this.username = null;
        this.agent = null;
        this.admin = false;
        this.resetNop();
        this.nopLevel = 0;
        
        this.chatRateLimit = new RateLimiter(this.room.config.ratelimits.chat);

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

    private resetNop() {
        clearInterval(this.nopTimer);
        this.nopLevel = 0;
        this.nopTimer = setInterval(() => {
            if (this.nopLevel++ >= 3) {
                this.socket.close();
            } else {
                this.send({
                    op: MSAgentProtocolMessageType.KeepAlive
                });
            }
        }, 10000)
    }

    private async parseMessage(data: string) {
        let msg: MSAgentProtocolMessage;
        try {
            msg = JSON.parse(data);
        } catch {
            this.socket.close();
            return;
        }
        this.resetNop();
        switch (msg.op) {
            case MSAgentProtocolMessageType.Join: {
                let joinMsg = msg as MSAgentJoinMessage;
                if (!joinMsg.data || !joinMsg.data.username || !joinMsg.data.username) {
                    this.socket.close();
                    return;
                }
                let username = htmlentities.encode(joinMsg.data.username);
                if (this.room.config.bannedWords.some(w => username.indexOf(w) !== -1)) {
                    this.socket.close();
                    return;
                }
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
                let talkMsg = msg as MSAgentTalkMessage;
                const commandParts = talkMsg.data.msg.split(' ');
                if (commandParts[0] === '/nick' && commandParts.length > 1) {
                const newUsername = htmlentities.encode(commandParts.slice(1).join(' '));
                if (this.room.config.bannedWords.some(w => newUsername.indexOf(w)!== -1)) {
                    return;
                }

                if (this.room.clients.some(u => u.username === newUsername)) {
                    let i = 1;
                    let uo = newUsername;
                    do {
                        newUsername = uo + i++;
                    } while (this.room.clients.some(u => u.username === newUsername))
                }

                this.username = newUsername;
                this.emit('talk', `Nickname changed to ${newUsername}`);
                return;
                }
                this.username = username;
                this.agent = joinMsg.data.agent;
                this.emit('join');
                break;
            }
            case MSAgentProtocolMessageType.Talk: {
                let talkMsg = msg as MSAgentTalkMessage;
                if (!talkMsg.data || !talkMsg.data.msg || !this.chatRateLimit.request()) {
                    return;
                }
                if (talkMsg.data.msg.length > this.room.config.charlimit) return;
                if (this.room.config.bannedWords.some(w => talkMsg.data.msg.indexOf(w) !== -1)) {
                    return;
                }
                this.emit('talk', talkMsg.data.msg);
                break;
            }
            case MSAgentProtocolMessageType.Admin: {
                let adminMsg = msg as MSAgentAdminMessage;
                if (!adminMsg.data) return;
                switch (adminMsg.data.action) {
                    case MSAgentAdminOperation.Login: {
                        let loginMsg = adminMsg as MSAgentAdminLoginMessage;
                        if (this.admin || !loginMsg.data.password) return;
                        let sha256 = createHash("sha256");
                        sha256.update(loginMsg.data.password);
                        let hash = sha256.digest("hex");
                        sha256.destroy();
                        let success = false;
                        if (hash === this.room.config.adminPasswordHash) {
                            this.admin = true;
                            success = true;
                            this.emit('admin');
                        }
                        let res : MSAgentAdminLoginResponse = {
                            op: MSAgentProtocolMessageType.Admin,
                            data: {
                                action: MSAgentAdminOperation.Login,
                                success
                            }
                        }
                        this.send(res);
                        break;
                    }
                    case MSAgentAdminOperation.GetIP: {
                        let getIPMsg = adminMsg as MSAgentAdminGetIPMessage;
                        if (!this.admin || !getIPMsg.data || !getIPMsg.data.username) return;
                        let _user = this.room.clients.find(c => c.username === getIPMsg.data.username);
                        if (!_user) return;
                        let res: MSAgentAdminGetIPResponse = {
                            op: MSAgentProtocolMessageType.Admin,
                            data: {
                                action: MSAgentAdminOperation.GetIP,
                                username: _user.username!,
                                ip: _user.ip
                            }
                        };
                        this.send(res);
                        break;
                    }
                    case MSAgentAdminOperation.Kick: {
                        let kickMsg = adminMsg as MSAgentAdminKickMessage;
                        if (!this.admin || !kickMsg.data || !kickMsg.data.username) return;
                        let _user = this.room.clients.find(c => c.username === kickMsg.data.username);
                        if (!_user) return;
                        let res: MSAgentErrorMessage = {
                            op: MSAgentProtocolMessageType.Error,
                            data: {
                                error: "You have been kicked."
                            }
                        };
                        await _user.send(res);
                        _user.socket.close();
                        break;
                    }
                    case MSAgentAdminOperation.Ban: {
                        let banMsg = adminMsg as MSAgentAdminBanMessage;
                        if (!this.admin || !banMsg.data || !banMsg.data.username) return;
                        let _user = this.room.clients.find(c => c.username === banMsg.data.username);
                        if (!_user) return;
                        let res: MSAgentErrorMessage = {
                            op: MSAgentProtocolMessageType.Error,
                            data: {
                                error: "You have been banned."
                            }
                        };
                        await this.room.db.banUser(_user.ip, _user.username!);
                        await _user.send(res);
                        _user.socket.close();
                        break;
                    }
                }
                break;
            }
        }
    }
}
