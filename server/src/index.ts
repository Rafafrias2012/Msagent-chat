import Fastify from 'fastify';
import FastifyWS from '@fastify/websocket';
import FastifyStatic from '@fastify/static';
import { Client } from './client.js';
import { MSAgentChatRoom } from './room.js';
import * as toml from 'toml';
import { IConfig } from './config.js';
import * as fs from 'fs';
import { TTSClient } from './tts.js';

let config: IConfig;
let configPath: string;
if (process.argv.length < 3)
    configPath = "./config.toml";
else
    configPath = process.argv[2];

if (!fs.existsSync(configPath)) {
    console.error(`${configPath} not found. Please copy config.example.toml and fill out fields.`);
    process.exit(1);
}

try {
    let configRaw = fs.readFileSync(configPath, "utf-8");
    config = toml.parse(configRaw);
} catch (e) {
    console.error(`Failed to read or parse ${configPath}: ${(e as Error).message}`);
    process.exit(1);
}

const app = Fastify({
    logger: true,
});

app.register(FastifyWS);

let tts = null;

if (config.tts.enabled) {
    tts = new TTSClient(config.tts);
    app.register(FastifyStatic, {
        root: config.tts.tempDir,
        prefix: "/api/tts/"
    });
}

let room = new MSAgentChatRoom(tts);

app.register(async app => {
    app.get("/socket", {websocket: true}, (socket, req) => {
        let client = new Client(socket, room);
        room.addClient(client);
    });
});


app.listen({host: config.http.host, port: config.http.port});