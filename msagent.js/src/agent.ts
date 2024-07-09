import { AcsData } from "./character.js";
import { AcsAnimationFrameInfo } from "./structs/animation.js";

export class Agent {
    private data: AcsData;
    private cnv: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    constructor(data: AcsData) {
        this.data = data;
        this.cnv = document.createElement("canvas");
        this.ctx = this.cnv.getContext("2d")!;
        this.cnv.width = data.characterInfo.charWidth;
        this.cnv.height = data.characterInfo.charHeight;
        this.cnv.style.position = "fixed";
        this.hide();
        this.renderFrame(this.data.animInfo[0].animationData.frameInfo[0]);
    }

    private renderFrame(frame: AcsAnimationFrameInfo) {
        for (const mimg of frame.images) {
            const img = this.data.images[mimg.imageIndex];
            let data = this.ctx.createImageData(img.image.width, img.image.height);
            for (let i = 0; i < img.image.data.length; i++) {
                let px = this.data.characterInfo.palette[img.image.data[i]];
                data.data[(i * 4)] = px.r;
                data.data[(i * 4) + 1] = px.g;
                data.data[(i * 4) + 2] = px.b;
                data.data[(i * 4) + 3] = px.a;
            }
            this.ctx.putImageData(data, mimg.xOffset, mimg.yOffset);
        }
    }

    addToDom(parent: HTMLElement = document.body) {
        parent.appendChild(this.cnv);
    }

    show() {
        this.cnv.style.display = "block";
    }

    hide() {
        this.cnv.style.display = "none";
    }
}