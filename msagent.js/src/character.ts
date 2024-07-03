import { BufferStream, SeekDir } from "./buffer.js";

class GUID {
    bytes: number[] = [];

    static read(buffer: BufferStream) {
        let guid = new GUID();

        for(var i = 0; i < 16; ++i)
            guid.bytes.push(buffer.readU8());

        return guid;
    }
};

class LOCATION {
    offset: number = 0;
    size: number = 0;

    static read(buffer: BufferStream) {
        let loc = new LOCATION();
        loc.offset = buffer.readU32LE();
        loc.size = buffer.readU32LE();
        return loc;
    }
};

class RGBAColor {
    r = 0;
    g = 0;
    b = 0;
    a = 0;

    // does what it says on the tin
    to_rgba(): number {
        return (this.r << 24) | (this.g << 16) | (this.b << 8) | this.a;
    }

    static from_gdi_rgbquad(val: number, transparent: boolean = false) {
        let quad = new RGBAColor();

        // Extract individual RGB values from the RGBQUAD
        // We ignore the last 8 bits because it is always left
        // as 0x00 or if uncleared, just random garbage.
        quad.r = (val & 0xff000000) >> 24;
        quad.g = (val & 0x00ff0000) >> 16;
        quad.b = (val & 0x0000ff00) >> 8;

        if(transparent)
            quad.a = 0;
        else
            quad.a = 255;

        return quad;
    }

    static read(buffer: BufferStream, transparent: boolean = false) {
        return RGBAColor.from_gdi_rgbquad(buffer.readU32LE(), transparent);
    }
}

// DA doesn't test individual bits, but for brevity I do
enum AcsCharacterInfoFlags {
    // This agent is configured for a given TTS.
    VoiceOutput = (1 << 5),
    
    // Could be a 2-bit value (where 01 = disable and 10 = enable)
    // I wonder why.
    WordBalloonDisabled = (1 << 8),
    WordBalloonEnabled = (1 << 9),
    
    // 16-18 are a 3-bit unsigned
    // value which stores a inner set of
    // bits to control the style of the wordballoon.
    
    StandardAnimationSet = (1 << 20)
};

class AcsVoiceInfoExtraData {
    langId = 0;
    langDialect = "";

    gender = 0;
    age = 0;

    style = "";

    static read(buffer: BufferStream) {
        let info = new AcsVoiceInfoExtraData();

        info.langId = buffer.readU16LE();

        info.langDialect = buffer.readPascalString();

        info.gender = buffer.readU16LE();
        info.age = buffer.readU16LE();

        info.style = buffer.readPascalString();

        return info;
    }
};

class AcsVoiceInfo {
    ttsEngineId = new GUID();
    ttsModeId = new GUID();

    speed = 0;
    pitch = 0;

    extraData: AcsVoiceInfoExtraData | null = null;

    static read(buffer: BufferStream) {
        let info = new AcsVoiceInfo();

        info.ttsEngineId = GUID.read(buffer);
        info.ttsModeId = GUID.read(buffer);

        info.speed = buffer.readU32LE();
        info.pitch = buffer.readU16LE();

        // extraData member
        if(buffer.readBool()) {
            info.extraData = AcsVoiceInfoExtraData.read(buffer);
        }
        
        return info;
    }
};

class AcsBalloonInfo {
    nrTextLines = 0;
    charsPerLine = 0;

    foreColor = new RGBAColor();
    backColor = new RGBAColor();
    borderColor = new RGBAColor();

    fontName = "";

    fontHeight = 0;
    fontWeight = 0;

    italic = false;
    unkFlag = false;

    static read(buffer: BufferStream) {
        let info = new AcsBalloonInfo();

        info.nrTextLines = buffer.readU8();
        info.charsPerLine = buffer.readU8();

        info.foreColor = RGBAColor.read(buffer);
        info.backColor = RGBAColor.read(buffer);
        info.borderColor = RGBAColor.read(buffer);

        info.fontName = buffer.readPascalString();
        info.fontHeight = buffer.readS32LE();
        info.fontWeight = buffer.readS32LE();

        info.italic = buffer.readBool();
        info.unkFlag = buffer.readBool();
        
        return info;
    }
};

class AcsTrayIcon {
    monoBitmap: Uint8Array | null = null;
    colorBitmap: Uint8Array | null = null;

    static read(buffer: BufferStream) {
        let icon = new AcsTrayIcon();
        icon.monoBitmap = buffer.readDataChunk(BufferStream.prototype.readU32LE);
        icon.colorBitmap = buffer.readDataChunk(BufferStream.prototype.readU32LE);
        return icon;
    }
}

class AcsStateInfo {
    stateName = "";
    animations : string[] = [];

    static read(buffer: BufferStream) {
        let info = new AcsStateInfo();

        info.stateName = buffer.readPascalString();
        info.animations = buffer.readCountedList(() => {
            return buffer.readPascalString();
        }, BufferStream.prototype.readU16LE);

        return info;
    }
}

class AcsLocalizedInfo {
    langId = 0;
    charName = "";
    charDescription = "";
    charExtraData = "";

    static read(buffer: BufferStream) {
        let info = new AcsLocalizedInfo();

        info.langId = buffer.readU16LE();
        info.charName = buffer.readPascalString();
        info.charDescription = buffer.readPascalString();
        info.charExtraData = buffer.readPascalString();

        return info;
    }
}

class AcsCharacterInfo {
    minorVersion = 0;
    majorVersion = 0;

    localizationInfoListLocation = new LOCATION();

    guid = new GUID();

    charWidth = 0;
    charHeight = 0;

    // Color index in the palette for the transparent color
    transparencyColorIndex = 0;

    flags = 0;

    animSetMajorVer = 0;
    animSetMinorVer = 0;

    voiceInfo : AcsVoiceInfo | null = null;
    balloonInfo : AcsBalloonInfo | null = null;

    // The color palette.
    palette: RGBAColor[] = [];

    trayIcon: AcsTrayIcon | null = null;

    stateInfo: AcsStateInfo[] = [];

    localizedInfo: AcsLocalizedInfo[] = [];

    static read(buffer: BufferStream) {
        let info = new AcsCharacterInfo();

        info.minorVersion = buffer.readU16LE();
        info.majorVersion = buffer.readU16LE();

        info.localizationInfoListLocation = LOCATION.read(buffer);
        info.guid = GUID.read(buffer);

        info.charWidth = buffer.readU16LE();
        info.charHeight = buffer.readU16LE();

        info.transparencyColorIndex = buffer.readU8();

        info.flags = buffer.readU32LE();

        info.animSetMajorVer = buffer.readU16LE();
        info.animSetMinorVer = buffer.readU16LE();

        if((info.flags & AcsCharacterInfoFlags.VoiceOutput)) {
            info.voiceInfo = AcsVoiceInfo.read(buffer);
        }

        if(
            (info.flags & AcsCharacterInfoFlags.WordBalloonEnabled) &&
            !(info.flags & AcsCharacterInfoFlags.WordBalloonDisabled)
        ) {
            info.balloonInfo = AcsBalloonInfo.read(buffer);
        }

        info.palette = buffer.readCountedList(() => {
            return RGBAColor.read(buffer);
        });

        // Tray icon
        if(buffer.readBool() == true) {
            info.trayIcon = AcsTrayIcon.read(buffer);
        }

        // this makes me wish type had sensible generics
        // so this could be encoded in a type, like c++ or rust lol
        info.stateInfo = buffer.readCountedList(() => {
            return AcsStateInfo.read(buffer);
        }, BufferStream.prototype.readU16LE);

        if(info.localizationInfoListLocation.offset != 0) {
            let lastOffset = buffer.tell();

            buffer.seek(info.localizationInfoListLocation.offset, SeekDir.BEG);

            info.localizedInfo = buffer.readCountedList(() => {
                return AcsLocalizedInfo.read(buffer);
            }, BufferStream.prototype.readU16LE)

            buffer.seek(lastOffset, SeekDir.BEG);
        }
        
        return info;
    }


}


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
