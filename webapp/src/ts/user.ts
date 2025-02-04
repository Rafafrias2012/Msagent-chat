import { Agent } from "@msagent-chat/msagent.js";

export class User {
    username: string;
    agent: Agent;
    muted: boolean;
    admin: boolean;
    
    constructor(username: string, agent: Agent) {
        this.username = username;
        this.agent = agent;
        this.muted = false;
        this.admin = false;
    }
}