export interface IConfig {
    http: {
        host: string;
        port: number;
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
}

export interface AgentConfig {
    friendlyName: string;
    filename: string;
}