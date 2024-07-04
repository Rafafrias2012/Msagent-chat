import { BufferStream, SeekDir } from './buffer.js';

import { LOCATION } from './structs/core.js';
import { AcsCharacterInfo } from './structs/character.js';
import { AcsAnimationEntry } from './structs/animation.js';

// Experiment for storing parsed data
class AcsData {
	characterInfo = new AcsCharacterInfo();
	animInfo: AcsAnimationEntry[] = [];
}

function logOffset(o: number, name: string) {
	let n = o >>> 0;
	console.log(name, 'offset:', '0x' + n.toString(16));
}

function agentCharacterParseACS(buffer: BufferStream) {
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

	logOffset(characterInfoLocation.offset, 'character info');
	logOffset(animationInfoLocation.offset, 'animation info');
	logOffset(imageInfoLocation.offset, 'image info');
	logOffset(audioInfoLocation.offset, 'audio info');

	buffer.withOffset(characterInfoLocation.offset, () => {
		acsData.characterInfo = AcsCharacterInfo.read(buffer);
	});

	buffer.withOffset(animationInfoLocation.offset, () => {
		acsData.animInfo = buffer.readCountedList(() => {
			return AcsAnimationEntry.read(buffer);
		});
	});

	console.log(acsData);
}

// For the testbed code only, remove when that gets axed
// (or don't, I'm not your dad)
export function agentParseCharacterTestbed(buffer: Uint8Array) {
	return agentCharacterParseACS(new BufferStream(buffer));
}

// TODO this will be the public API
// Dunno about maintaining canvases. We can pass a div into agentInit and add a characterInit() which recieves it
// (which we then mount characters and their wordballoons into?)
export function agentCreateCharacter(data: Uint8Array): Promise<void> {
	throw new Error('Not implemented yet');
}
