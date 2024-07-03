export interface IConfig {
    http: {
        host: string;
        port: number;
    }
    chat: ChatConfig;
    tts: TTSConfig
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
}