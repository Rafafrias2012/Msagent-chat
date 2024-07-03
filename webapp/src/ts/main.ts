import { MSWindow, MSWindowStartPosition } from "./MSWindow.js";
import { agentInit } from "@msagent-chat/msagent.js";
import { MSAgentClient } from "./client.js";

let Room : MSAgentClient | null = null;

const elements = {
    logonView: document.getElementById("logonView") as HTMLDivElement,
    logonWindow: document.getElementById("logonWindow") as HTMLDivElement,
    logonForm: document.getElementById("logonForm") as HTMLFormElement,
    logonUsername: document.getElementById("logonUsername") as HTMLInputElement,

    chatView: document.getElementById("chatView") as HTMLDivElement,
    chatInput: document.getElementById("chatInput") as HTMLInputElement,
    chatSendBtn: document.getElementById("chatSendBtn") as HTMLButtonElement
}

let logonWindow = new MSWindow(elements.logonWindow, {
    width: 500,
    height: 275,
    hasClose: false,
    startPosition: MSWindowStartPosition.Center
});

logonWindow.show();

elements.logonForm.addEventListener('submit', e => {
    e.preventDefault();
    connectToRoom();
});

elements.chatInput.addEventListener('keypress', e => {
    // enter
    if (e.key === "Enter") talk();
});

elements.chatSendBtn.addEventListener('click', () => {
    talk();
});

async function connectToRoom() {
    Room = new MSAgentClient("http://127.0.0.1:3000");
    await Room.connect();
    await Room.join(elements.logonUsername.value, "test");
    logonWindow.hide();
    elements.logonView.style.display = "none";
    elements.chatView.style.display = "block";
};

document.addEventListener('DOMContentLoaded', async () => {
    await agentInit();
});

function talk() {
    if (Room === null) return;
    Room.talk(elements.chatInput.value);
    elements.chatInput.value = "";
}
