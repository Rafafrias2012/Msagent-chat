import Fastify from 'fastify';
import FastifyWS from '@fastify/websocket';
import FastifyStatic from '@fastify/static';
import { Client } from './client.js';
import { MSAgentChatRoom } from './room.js';
import * as toml from 'toml';
import { IConfig } from './config.js';
import * as fs from 'fs';
import { TTSClient } from './tts.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

app.register(FastifyStatic, {
    root: path.dirname(fileURLToPath(import.meta.url)) + "/../../webapp/dist/",
    prefix: "/",
    decorateReply: true
  });

if (config.tts.enabled) {
    tts = new TTSClient(config.tts);
    app.register(FastifyStatic, {
        root: config.tts.tempDir,
        prefix: "/api/tts/",
        decorateReply: false
    });
}

if (!config.chat.agentsDir.endsWith("/")) config.chat.agentsDir += "/";
if (!fs.existsSync(config.chat.agentsDir)) {
    console.error(`Directory ${config.chat.agentsDir} does not exist.`);
    process.exit(1);
}

for (let agent of config.agents) {
    if (!fs.existsSync(path.join(config.chat.agentsDir, agent.filename))) {
        console.error(`${agent.filename} does not exist.`);
        process.exit(1);
    }
}

app.register(FastifyStatic, {
    root: path.resolve(config.chat.agentsDir),
    prefix: "/api/agents/",
    decorateReply: false,
});

app.get("/api/agents", (req, res) => {
    return config.agents;
});

let room = new MSAgentChatRoom(config.chat, config.agents, tts);

app.register(async app => {
    app.get("/api/socket", {websocket: true}, (socket, req) => {
        let client = new Client(socket, room);
        room.addClient(client);
    });
});


app.listen({host: config.http.host, port: config.http.port});