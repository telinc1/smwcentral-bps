import {crc32} from "./crc32.js";

export abstract class PatchError extends Error {}

export class MalformedPatchError extends PatchError {
    constructor() {
        super("Not a BPS patch");
    }
}

export abstract class WrongInputError extends PatchError {
    constructor() {
        super("This patch is not intended for this ROM");
    }
}

export class WrongInputSizeError extends WrongInputError {
    constructor(public readonly expectedSize: number, public readonly actualSize: number) {
        super();
    }
}

export class WrongInputChecksumError extends WrongInputError {
    constructor(public readonly expectedChecksum: number, public readonly actualChecksum: number) {
        super();
    }
}

const SourceRead = 0;
const TargetRead = 1;
const SourceCopy = 2;
const TargetCopy = 3;

const u32at = (patch: Uint8Array, pos: number) =>
    ((patch[pos + 0]! << 0) | (patch[pos + 1]! << 8) | (patch[pos + 2]! << 16) | (patch[pos + 3]! << 24)) >>> 0;

export function getExpectedChecksum(patch: Uint8Array): number {
    return u32at(patch, patch.length - 12);
}

// no error checking, other than BPS signature, input size/crc and JS auto checking array bounds
export function applyBPS(rom: Uint8Array, patch: Uint8Array): Uint8Array {
    let patchpos = 0;

    const u8 = () => patch[patchpos++];

    function decode() {
        let ret = 0;
        let sh = 0;

        while (true) {
            const next = u8()!;
            ret += (next ^ 0x80) << sh;

            if (next & 0x80) {
                return ret;
            }

            sh += 7;
        }
    }

    function decodeSigned() {
        const enc = decode();
        const ret = enc >> 1;

        return enc & 1 ? -ret : ret;
    }

    // "BPS1"
    if (u8() !== 0x42 || u8() !== 0x50 || u8() !== 0x53 || u8() !== 0x31) {
        throw new MalformedPatchError();
    }

    const expectedSize = decode();
    if (expectedSize !== rom.length) {
        throw new WrongInputSizeError(expectedSize, rom.length);
    }

    const actualChecksum = crc32(rom);
    const expectedChecksum = getExpectedChecksum(patch);
    if (actualChecksum !== expectedChecksum) {
        throw new WrongInputChecksumError(expectedChecksum, actualChecksum);
    }

    const out = new Uint8Array(decode());

    let outpos = 0;

    const metalen = decode();
    patchpos += metalen; // can't join these two, JS reads patchpos before calling decode

    let inreadpos = 0;
    let outreadpos = 0;

    while (patchpos < patch.length - 12) {
        const thisinstr = decode();
        const len = (thisinstr >> 2) + 1;
        const action = thisinstr & 3;

        switch (action) {
            case SourceRead: {
                for (let i = 0; i < len; i += 1) {
                    out[outpos] = rom[outpos]!;
                    outpos++;
                }

                break;
            }

            case TargetRead: {
                for (let i = 0; i < len; i += 1) {
                    out[outpos++] = u8()!;
                }

                break;
            }

            case SourceCopy: {
                inreadpos += decodeSigned();

                for (let i = 0; i < len; i += 1) {
                    out[outpos++] = rom[inreadpos++]!;
                }

                break;
            }

            case TargetCopy: {
                outreadpos += decodeSigned();

                for (let i = 0; i < len; i += 1) {
                    out[outpos++] = out[outreadpos++]!;
                }

                break;
            }
        }
    }

    return out;
}
