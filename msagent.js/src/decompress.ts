
// Please note that the "meaningless" shifts of 0 are to force
// the value to be a 32-bit integer. Do not remove them.

function LOWORD(n: number) {
    return (n >>> 0) & 0xffff;
}

function LOBYTE(n: number) {
    return (n >>> 0) & 0xff;
}

function HIWORD(n: number) {
    return (n >>> 16) & 0xffff;
}

// Decompress Agent compressed data. This compression algorithm sucks.
// [dest] is to be preallocated to the decompressed data size.
export function compressDecompress(src: Uint8Array, dest: Uint8Array) {
    let bitCount = 0;
    let srcPtr = 0;
    let destPtr = 0;
    let srcOffset = 0;

    let dv = new DataView(src.buffer, src.byteOffset, src.byteLength);

    let putb = (b: number) => dest[destPtr++] = b;

    // Make sure the bitstream is valid
    if(src.length <= 7 || src[0] != 0)
        return 0;

    for(bitCount = 1; src[src.length - bitCount] == 0xff; bitCount++) {
        if(bitCount > 6)
            break;
    }

    if(bitCount < 6)
        return 0;

    bitCount = 0;
    srcPtr += 5;

    while((srcPtr < src.length) && (destPtr < dest.length)) {
        let quad = dv.getUint32(srcPtr - 4, true);

        if(quad & (1 << LOWORD(bitCount))) {
            srcOffset = 1;

            if(quad & (1 << LOWORD(bitCount+1))) {
                if(quad & (1 << LOWORD(bitCount + 2))) {
                    if(quad & (1 << LOWORD(bitCount + 3))) {
                        quad >>= LOWORD(bitCount + 4);
                        quad &= 0x000FFFFF;

                        // End of compressed bitstream
                        if(quad == 0x000FFFFF)
                            break;

                        quad += 4673;
                        bitCount += 24;
                        srcOffset = 2;
                    } else {
                        quad >>= LOWORD(bitCount + 4);
                        quad &= 0x0000FFF;
                        quad += 577;
                        bitCount += 16;
                    }
                } else {
                    quad >>= LOWORD(bitCount + 3);
                    quad &= 0x000001FF;
                    quad += 65;
                    bitCount += 12;
                }
            } else {
                quad >>= LOWORD(bitCount + 2);
                quad &= 0x0000003F;
                quad += 1;
                bitCount += 8;
            }

            srcPtr += (bitCount / 8);
            bitCount &= 7;
            let runCount = 0;
            let runLength = dv.getUint32(srcPtr - 4, true);

            while(runLength & (1 << LOWORD(bitCount + runCount))) {
                runCount++;

                if(runCount > 11)
                    break;
            }

            runLength >>= LOWORD(bitCount + runCount + 1);
            runLength &= (1 << runCount) -1;
            runLength += 1 << runCount;
            runLength += srcOffset;
            bitCount = runCount * 2 + 1;

            if(destPtr + runLength > dest.length)
                break;

            while(runLength > 0) {
                putb(dest[destPtr - quad]);
                runLength--;
            }

        } else {
            // a literal byte
            quad >>= LOWORD(bitCount + 1)
            bitCount += 9;
            putb(LOBYTE(quad));
        }

        srcPtr += bitCount / 8;
        bitCount &= 7;
    }
}
