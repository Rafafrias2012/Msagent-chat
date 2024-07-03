export interface IConfig {
    http: {
        host: string;
        port: number;
    }
    tts: TTSConfig
}

export interface TTSConfig {
    enabled: boolean;
    server: string;
    voice: string;
    tempDir: string;
    wavExpirySeconds: number;
}