/*
struct AcsImageInfo {
    u8 unkStart;
    u16 width;
    u16 height;
    bool isCompressed;
    
    // This algorithm is the size used for allocating
    // the decompression buffer.
    //     ((Width + 3) & 0xFC) * Height)
    
    // Data
    DATABLOCK imageData;
    
    // The data here is a Win32 RGNDATA
    COMPRESSED regionData;
};

struct AcsImageInfoPointer {
    LOCATION imageInfoLocation;
    u32 checksumMaybe;
    
    AcsImageInfo imageInfo @ imageInfoLocation.offset;
};
*/

import { BufferStream } from '../buffer';
import { compressDecompress } from '../decompress';
import { COMPRESSED_DATABLOCK, LOCATION, RGNDATA } from './core';

export class AcsImage {
	width = 0;
	height = 0;

	data = new Uint8Array();
	regionData = new RGNDATA();

	static read(buffer: BufferStream) {
		let image = new AcsImage();

		// This has unknown purpose
		let eat = buffer.readU8();

		image.width = buffer.readU16LE();
		image.height = buffer.readU16LE();

		let isCompressed = buffer.readBool();

		let data = buffer.readDataChunk();

		if (isCompressed) {
			image.data = new Uint8Array(((image.width + 3) & 0xfc) * image.height);
			compressDecompress(data, image.data);
		} else {
			image.data = data;
		}



        // this will be a rgndata (TODO) read this
        let temp = COMPRESSED_DATABLOCK.read(buffer);
		let tempBuffer = new BufferStream(temp.data);

		image.regionData = RGNDATA.read(tempBuffer);

        return image;
	}
}

export class AcsImageEntry {
    image = new AcsImage();

	static read(buffer: BufferStream) {
		let image = new AcsImageEntry();

		// We discard both after we're done.
		let loc = LOCATION.read(buffer);
		let checksum = buffer.readU32LE();

        buffer.withOffset(loc.offset, () => {
            image.image = AcsImage.read(buffer);
        });

		return image;
	}
}
