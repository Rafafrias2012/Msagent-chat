import { createNanoEvents, Emitter, Unsubscribe } from 'nanoevents';
import {
	MSAgentAddUserMessage,
	MSAgentChatMessage,
	MSAgentInitMessage,
	MSAgentJoinMessage,
	MSAgentProtocolMessage,
	MSAgentProtocolMessageType,
	MSAgentRemoveUserMessage,
	MSAgentTalkMessage
} from '@msagent-chat/protocol';
import { User } from './user';
import { agentCreateCharacterFromUrl } from '@msagent-chat/msagent.js';

export interface MSAgentClientEvents {
	close: () => void;
	join: () => void;
	adduser: (user: User) => void;
	remuser: (user: User) => void;
	chat: (user: User, msg: string) => void;
}

export interface APIAgentInfo {
	friendlyName: string;
	filename: string;
}

export class MSAgentClient {
	private url: string;
	private socket: WebSocket | null;
	private events: Emitter;
	private users: User[];
	private playingAudio: Map<string, HTMLAudioElement> = new Map();
	private charlimit: number = 0;

	private username: string | null = null;
	private agentContainer: HTMLElement;
	private agent: string | null = null;

	constructor(url: string, agentContainer: HTMLElement) {
		this.url = url;
		this.agentContainer = agentContainer;
		this.socket = null;
		this.events = createNanoEvents();
		this.users = [];
	}

	on<E extends keyof MSAgentClientEvents>(event: E, callback: MSAgentClientEvents[E]): Unsubscribe {
		return this.events.on(event, callback);
	}

	async getAgents() {
		let res = await fetch(this.url + '/api/agents');
		return (await res.json()) as APIAgentInfo[];
	}

	connect(): Promise<void> {
		return new Promise((res) => {
			let url = new URL(this.url);
			switch (url.protocol) {
				case 'http:':
					url.protocol = 'ws:';
					break;
				case 'https:':
					url.protocol = 'wss:';
					break;
				default:
					throw new Error(`Unknown protocol ${url.protocol}`);
			}
			url.pathname = '/api/socket';
			this.socket = new WebSocket(url);
			this.socket.addEventListener('open', () => res());
			this.socket.addEventListener('message', (e) => {
				if (e.data instanceof Blob || e.data instanceof ArrayBuffer) {
					// server should not send binary
					return;
				}
				this.handleMessage(e.data);
			});
			this.socket.addEventListener('close', () => {
				this.events.emit('close');
                // TODO: Make this clean
                window.location.reload();
			});
		});
	}

	send(msg: MSAgentProtocolMessage) {
		if (this.socket === null || this.socket.readyState !== this.socket.OPEN) {
			console.error('Tried to send data on a closed or uninitialized socket');
			return;
		}
		let data = JSON.stringify(msg);
		this.socket!.send(data);
	}

	join(username: string, agent: string) {
		if (this.socket === null || this.socket.readyState !== this.socket.OPEN) {
			throw new Error('Tried to join() on a closed or uninitialized socket');
		}
		return new Promise<void>((res) => {
			let msg: MSAgentJoinMessage = {
				op: MSAgentProtocolMessageType.Join,
				data: {
					username,
					agent
				}
			};
			let u = this.on('join', () => {
				u();
				res();
			});
			this.send(msg);
		});
	}

	talk(msg: string) {
		let talkMsg: MSAgentTalkMessage = {
			op: MSAgentProtocolMessageType.Talk,
			data: {
				msg
			}
		};
		this.send(talkMsg);
	}

	getCharlimit() {
		return this.charlimit;
	}

	private async handleMessage(data: string) {
		let msg: MSAgentProtocolMessage;
		try {
			msg = JSON.parse(data);
		} catch (e) {
			console.error(`Failed to parse message from server: ${(e as Error).message}`);
			return;
		}
		switch (msg.op) {
			case MSAgentProtocolMessageType.Init: {
				let initMsg = msg as MSAgentInitMessage;
				this.username = initMsg.data.username;
				this.agent = initMsg.data.agent;
				this.charlimit = initMsg.data.charlimit;
				for (let _user of initMsg.data.users) {
					let agent = await agentCreateCharacterFromUrl(this.url + '/api/agents/' + _user.agent);
                    agent.setUsername(_user.username);
					agent.addToDom(this.agentContainer);
					agent.show();
					let user = new User(_user.username, agent);
					this.users.push(user);
				}
				this.events.emit('join');
				break;
			}
			case MSAgentProtocolMessageType.AddUser: {
				let addUserMsg = msg as MSAgentAddUserMessage;
				let agent = await agentCreateCharacterFromUrl(this.url + '/api/agents/' + addUserMsg.data.agent);
                agent.setUsername(addUserMsg.data.username);
				agent.addToDom(this.agentContainer);
				agent.show();
				let user = new User(addUserMsg.data.username, agent);
				this.users.push(user);
				this.events.emit('adduser', user);
				break;
			}
			case MSAgentProtocolMessageType.RemoveUser: {
				let remUserMsg = msg as MSAgentRemoveUserMessage;
				let user = this.users.find((u) => u.username === remUserMsg.data.username);
				if (!user) return;
				user.agent.hide(true);
				if (this.playingAudio.has(user!.username)) {
                    this.playingAudio.get(user!.username)?.pause();
					this.playingAudio.delete(user!.username);
				}
				this.users.splice(this.users.indexOf(user), 1);
				this.events.emit('remuser', user);
				break;
			}
			case MSAgentProtocolMessageType.Chat: {
				let chatMsg = msg as MSAgentChatMessage;
				let user = this.users.find((u) => u.username === chatMsg.data.username);
				this.events.emit('chat', user, chatMsg.data.message);
				if (chatMsg.data.audio !== undefined) {
					let audio = new Audio(this.url + chatMsg.data.audio);
					if (this.playingAudio.has(user!.username)) {
						this.playingAudio.get(user!.username)?.pause();
						this.playingAudio.delete(user!.username);
					}

					this.playingAudio.set(user!.username, audio);

					audio.addEventListener('ended', () => {
						// give a bit of time before the wordballoon disappears
						setTimeout(() => {
                            if (this.playingAudio.get(user!.username) === audio) {
							    user!.agent.stopSpeaking();
						        this.playingAudio.delete(user!.username);
                            }
						}, 1000);
					});

					user?.agent.speak(chatMsg.data.message);
					audio.play();
				}
				break;
			}
		}
	}
}
