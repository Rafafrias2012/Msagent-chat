import { MSWindow, MSWindowStartPosition } from "./MSWindow.js"

const elements = {
    logonView: document.getElementById("logonView") as HTMLDivElement,
    logonWindow: document.getElementById("logonWindow") as HTMLDivElement,
    logonForm: document.getElementById("logonForm") as HTMLFormElement,

    chatView: document.getElementById("chatView") as HTMLDivElement,
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

    logonWindow.hide();
    elements.logonView.style.display = "none";
    elements.chatView.style.display = "block";
});