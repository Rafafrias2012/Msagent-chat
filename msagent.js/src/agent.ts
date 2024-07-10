import { BufferStream, SeekDir } from './buffer.js';
import { AcsData } from './character.js';
import { AcsAnimation, AcsAnimationFrameInfo } from './structs/animation.js';
import { AcsImageEntry } from './structs/image.js';

// probably should be in a utility module
function dwAlign(off: number): number {
	let ul = off >>> 0;

	ul += 3;
	ul >>= 2;
	ul <<= 2;
	return ul;
}

class AgentAnimationState {
    char: Agent;
    anim: AcsAnimation;
    frameIndex = 0;

    interval = 0;

    constructor(char: Agent, anim: AcsAnimation) {
        this.char = char;
        this.anim = anim;
    }

    // start playing the animation
    play() {
        this.nextFrame();
    }

    nextFrame() {
        this.char.renderFrame(this.anim.frameInfo[this.frameIndex++]);

        if(this.frameIndex >= this.anim.frameInfo.length) {
            this.char.animationFinished();
            return;
        }

        this.interval = setTimeout(() => {
            this.nextFrame();
        }, this.anim.frameInfo[this.frameIndex].frameDuration * 10)
    }

}

export class Agent {
	private data: AcsData;
	private cnv: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

    private animState: AgentAnimationState | null = null;

	constructor(data: AcsData) {
		this.data = data;
		this.cnv = document.createElement('canvas');
		this.ctx = this.cnv.getContext('2d')!;
		this.cnv.width = data.characterInfo.charWidth;
		this.cnv.height = data.characterInfo.charHeight;
		this.cnv.style.position = 'fixed';
		this.hide();
	}

	renderFrame(frame: AcsAnimationFrameInfo) {
        this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
		for (const mimg of frame.images) {
			this.drawImage(this.data.images[mimg.imageIndex], mimg.xOffset, mimg.yOffset);
		}
	}

    // Draw a single image from the agent's image table.
	drawImage(imageEntry: AcsImageEntry, xOffset: number, yOffset: number) {
		let rgbaBuffer = new Uint32Array(imageEntry.image.width * imageEntry.image.height);

		let buffer = imageEntry.image.data;
		let bufStream = new BufferStream(buffer);

		let rows = new Array<Uint8Array>(imageEntry.image.height - 1);

        // Read all the rows bottom-up first. This idiosyncracy is due to the fact
        // that the bitmap data is actually formatted to be used as a GDI DIB
        // (device-independent bitmap), so it inherits all the strange baggage from that.
		for (let y = imageEntry.image.height - 1; y >= 0; --y) {
			let row = bufStream.subBuffer(imageEntry.image.width).raw();
			let rowResized = row.slice(0, imageEntry.image.width);
			rows[y] = rowResized;

            // Seek to the next DWORD aligned spot to get to the next row.
            // For most images this may mean not seeking at all.
            bufStream.seek(dwAlign(bufStream.tell()), SeekDir.BEG);
		}

        // Next, draw the rows converted to RGBA, top down (so it's drawn as you'd expect)
		for (let y = 0; y < imageEntry.image.height - 1; ++y) {
			let row = rows[y];
			for (let x = 0; x < imageEntry.image.width; ++x) {
				rgbaBuffer[y * imageEntry.image.width + x] = this.data.characterInfo.palette[row[x]].to_rgba();
			}
		}

		let data = new ImageData(new Uint8ClampedArray(rgbaBuffer.buffer), imageEntry.image.width, imageEntry.image.height);
		this.ctx.putImageData(data, xOffset, yOffset);
	}

	addToDom(parent: HTMLElement = document.body) {
		parent.appendChild(this.cnv);
	}

    playAnimation(index: number) {
        if(this.animState != null)
            throw new Error('Cannot play multiple animations at once.');
        let animInfo = this.data.animInfo[index];

        console.log("playing animation", animInfo.name);
        this.animState = new AgentAnimationState(this, animInfo.animationData);

        this.animState.play();
    }

    animationFinished() {
        this.animState = null;
    }

	show() {
		this.cnv.style.display = 'block';
        // TODO: play the show animation
	}

	hide() {
        // TODO: play the hide animation (then clear the canvas)
        // (if not constructing. We can probably just duplicate this one line and put it in the constructor tbh)
		this.cnv.style.display = 'none';
	}
}
