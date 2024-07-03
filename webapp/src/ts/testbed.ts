// Testbed code
// This will go away when it isn't needed

import * as msagent from "@msagent-chat/msagent.js";

let input = document.getElementById("testbed-input") as HTMLInputElement;

input.addEventListener("change", async () => {


    let buffer = await input.files![0].arrayBuffer();

    console.log("About to parse character");
    msagent.agentParseCharacterTestbed(new Uint8Array(buffer));
    console.log("parsed character");
})

document.addEventListener("DOMContentLoaded", async () => {
    await msagent.agentInit();
    console.log("msagent initalized!");
})
