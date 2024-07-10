import { MSWindow, MSWindowStartPosition } from "./MSWindow.js";
import { agentInit } from "@msagent-chat/msagent.js";
import { MSAgentClient } from "./client.js";


const elements = {
    logonView: document.getElementById("logonView") as HTMLDivElement,
    logonWindow: document.getElementById("logonWindow") as HTMLDivElement,
    logonForm: document.getElementById("logonForm") as HTMLFormElement,
    logonUsername: document.getElementById("logonUsername") as HTMLInputElement,
    agentSelect: document.getElementById("agentSelect") as HTMLSelectElement,

    chatView: document.getElementById("chatView") as HTMLDivElement,
    chatInput: document.getElementById("chatInput") as HTMLInputElement,
    chatSendBtn: document.getElementById("chatSendBtn") as HTMLButtonElement
}

let Room : MSAgentClient = new MSAgentClient(`${window.location.protocol}//${window.location.host}`, elements.chatView);

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
    if (!elements.agentSelect.value) {
        alert("Please select an agent.");
        return;
    }
    await Room.connect();
    await Room.join(elements.logonUsername.value, elements.agentSelect.value);
    elements.chatInput.maxLength = Room.getCharlimit();
    logonWindow.hide();
    elements.logonView.style.display = "none";
    elements.chatView.style.display = "block";
};

document.addEventListener('DOMContentLoaded', async () => {
    await agentInit();
    for (const agent of await Room.getAgents()) {
        let option = document.createElement("option");
        option.innerText = agent.friendlyName;
        option.value = agent.filename;
        elements.agentSelect.appendChild(option);
    }
});

function talk() {
    if (Room === null) return;
    Room.talk(elements.chatInput.value);
    elements.chatInput.value = "";
}
