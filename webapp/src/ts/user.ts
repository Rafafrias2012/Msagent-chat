import { Agent } from "@msagent-chat/msagent.js";

export class User {
    username: string;
    agent: Agent
    
    constructor(username: string, agent: Agent) {
        this.username = username;
        this.agent = agent;
    }
}