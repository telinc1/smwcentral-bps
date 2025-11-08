const crcTable: number[] = [];

for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    crcTable[n] = c;
}

export function crc32(bytes: Uint8Array): number {
    let crc = 0 ^ -1;

    for (let i = 0; i < bytes.length; i += 1) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]!) & 0xff]!;
    }

    return (crc ^ -1) >>> 0;
}
