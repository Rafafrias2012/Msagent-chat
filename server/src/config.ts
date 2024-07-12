export interface IConfig {
    http: {
        host: string;
        port: number;
        proxied: boolean;
    }
    mysql: MySQLConfig;
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
    adminPasswordHash: string;
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

export interface MySQLConfig {
    host: string;
    username: string;
    password: string;
    database: string;
}