import { BufferStream, SeekDir } from "../buffer.js";

export class GUID {
    bytes: number[] = [];

    static read(buffer: BufferStream) {
        let guid = new GUID();

        for(var i = 0; i < 16; ++i)
            guid.bytes.push(buffer.readU8());

        return guid;
    }
};

export class LOCATION {
    offset: number = 0;
    size: number = 0;

    static read(buffer: BufferStream) {
        let loc = new LOCATION();
        loc.offset = buffer.readU32LE();
        loc.size = buffer.readU32LE();
        return loc;
    }
};

export class RGBAColor {
    r = 0;
    g = 0;
    b = 0;
    a = 0;

    // Does what it says on the tin, converts to RGBA
    to_rgba(): number {
        return (this.r << 24) | (this.g << 16) | (this.b << 8) | this.a;
    }

    static from_gdi_rgbquad(val: number) {
        let quad = new RGBAColor();

        // Extract individual RGB values from the RGBQUAD
        // We ignore the last 8 bits because it is always left
        // as 0x00 or if uncleared, just random garbage.
        quad.r = (val & 0xff000000) >> 24;
        quad.g = (val & 0x00ff0000) >> 16;
        quad.b = (val & 0x0000ff00) >> 8;
        quad.a = 255;

        return quad;
    }

    static read(buffer: BufferStream) {
        return RGBAColor.from_gdi_rgbquad(buffer.readU32LE());
    }
}
