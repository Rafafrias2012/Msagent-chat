import { BufferStream, SeekDir } from "./buffer.js";

import { LOCATION } from "./structs/core.js";
import { AcsCharacterInfo } from "./structs/character.js";


function agentCharacterParseACS(buffer: BufferStream) {
    let magic = buffer.readU32LE();

    if(magic != 0xabcdabc3) {
        throw new Error("This is not an ACS file.");
    }

    // Read the rest of the header.
    let characterInfoLocation = LOCATION.read(buffer);
    let animationInfoLocation = LOCATION.read(buffer);
    let imageInfoLocation = LOCATION.read(buffer);
    let audioInfoLocation = LOCATION.read(buffer);

    console.log(characterInfoLocation.offset.toString(16));

    // Read the character info in.
    buffer.seek(characterInfoLocation.offset, SeekDir.BEG);
    let characterInfo = AcsCharacterInfo.read(buffer);
    console.log(characterInfo)

    // Read animation info
}

// For the testbed code only, remove when that gets axed
// (or don't, I'm not your dad)
export function agentParseCharacterTestbed(buffer: Uint8Array) {
    return agentCharacterParseACS(new BufferStream(buffer));
}

// TODO this will be the public API
// Dunno about maintaining canvases. We can pass a div into agentInit and add a characterInit() which recieves it
// (which we then mount characters and their wordballoons into?)
export function agentCreateCharacter(data: Uint8Array) : Promise<void> {
    throw new Error("Not implemented yet");
}
