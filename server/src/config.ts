export interface IConfig {
    http: {
        host: string;
        port: number;
        proxied: boolean;
    }
    chat: ChatConfig;
    tts: TTSConfig;
    agents: AgentConfig[];
}

export interface TTSConfig {
    enabled: boolean;
    server: string;
    voice: string;
    tempDir: string;
    wavExpirySeconds: number;
}

export interface ChatConfig {
    charlimit: number;
    agentsDir: string;
    maxConnectionsPerIP: number;
    ratelimits: {
        chat: RateLimitConfig;
    }
}

export interface AgentConfig {
    friendlyName: string;
    filename: string;
}



export interface RateLimitConfig {
    seconds: number;
    limit: number;
}