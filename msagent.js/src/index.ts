import { wordballoonInit } from "./wordballoon.js";

export * from "./types.js";
export * from "./sprite.js";
export * from "./wordballoon.js";


// Convinence function which initalizes all of msagent.js.
export async function agentInit() {
    await wordballoonInit();
}
