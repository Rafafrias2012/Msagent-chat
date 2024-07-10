import { BufferStream, SeekDir } from './buffer.js';

import { LOCATION } from './structs/core.js';
import { AcsCharacterInfo } from './structs/character.js';
import { AcsAnimationEntry } from './structs/animation.js';
import { AcsImageEntry } from './structs/image.js';
import { Agent } from './agent.js';

// Data
export class AcsData {
	characterInfo = new AcsCharacterInfo();
	animInfo: AcsAnimationEntry[] = [];
	images: AcsImageEntry[] = [];
}

function agentCharacterParseACS(buffer: BufferStream): AcsData {
	// Make sure the magic is correct for the ACS file.
	if (buffer.readU32LE() != 0xabcdabc3) {
		throw new Error('The provided data buffer does not contain valid ACS data.');
	}

	let acsData = new AcsData();

	// Read the rest of the header.
	let characterInfoLocation = LOCATION.read(buffer);
	let animationInfoLocation = LOCATION.read(buffer);
	let imageInfoLocation = LOCATION.read(buffer);
	let audioInfoLocation = LOCATION.read(buffer);


	buffer.withOffset(characterInfoLocation.offset, () => {
		acsData.characterInfo = AcsCharacterInfo.read(buffer);
	});

	buffer.withOffset(animationInfoLocation.offset, () => {
		acsData.animInfo = buffer.readCountedList(() => {
			return AcsAnimationEntry.read(buffer);
		});
	});

	buffer.withOffset(imageInfoLocation.offset, () => {
		acsData.images = buffer.readCountedList(() => {
			return AcsImageEntry.read(buffer);
		});
	});

	return acsData;
}

// TODO this will be the public API
// Dunno about maintaining canvases. We can pass a div into agentInit and add a characterInit() which recieves it
// (which we then mount characters and their wordballoons into?)
export function agentCreateCharacter(data: Uint8Array): Agent {
	return new Agent(agentCharacterParseACS(new BufferStream(data)));
}
