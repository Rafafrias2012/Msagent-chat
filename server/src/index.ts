import Fastify from 'fastify';
import FastifyWS from '@fastify/websocket';
import { Client } from './client.js';
import { MSAgentChatRoom } from './room.js';

const app = Fastify({
    logger: true,
});

app.register(FastifyWS);

let room = new MSAgentChatRoom();

app.get("/socket", {websocket: true}, (socket, req) => {
    let client = new Client(socket, room);
    room.addClient(client);
});

let port;
if (process.argv.length < 3 || isNaN(port = parseInt(process.argv[2]))) {
    console.error("Usage: index.js [port]");
    process.exit(1);
}
app.listen({host: "127.0.0.1", port});