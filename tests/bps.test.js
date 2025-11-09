import * as assert from "node:assert/strict";
import * as crypto from "node:crypto";
import {describe, test} from "node:test";

import {
    crc32,
    applyBPS,
    MalformedPatchError,
    WrongInputChecksumError,
    WrongInputSizeError,
    getExpectedChecksum,
} from "../dist/index.js";

import {readDataFile} from "./utils/file.js";
import {hasROM, readROM} from "./utils/roms.js";

function assertBytesEqual(actual, expected) {
    assert.strictEqual(actual.length, expected.length);

    for (let i = 0; i < actual.length; i++) {
        assert.strictEqual(actual[i], expected[i]);
    }
}

function assertHashEqual(actual, expectedHash) {
    assert.strictEqual(crypto.hash("sha256", actual), expectedHash);
}

function assertPatchChecksum(patchName, expectedName) {
    const patch = readDataFile(patchName);
    const expected = readDataFile(expectedName);

    assert.strictEqual(getExpectedChecksum(patch), crc32(expected));
}

function assertPatch(patchName, baseName, expectedName) {
    const patch = readDataFile(patchName);

    const base = readDataFile(baseName);
    const expected = readDataFile(expectedName);

    assertBytesEqual(applyBPS(base, patch), expected);
}

function assertPatchROM(t, patchName, baseROM, expectedHash) {
    if (!hasROM(baseROM)) {
        t.skip(`base ROM "${baseROM}" not available`);
        return;
    }

    const patch = readDataFile(patchName);
    const base = readROM(baseROM);

    assertHashEqual(applyBPS(base, patch), expectedHash);
}

describe("bps", () => {
    describe("getExpectedChecksum", () => {
        test("a_to_a.bps", () => {
            assertPatchChecksum("a_to_a.bps", "a.txt");
        });

        test("b_to_a.bps", () => {
            assertPatchChecksum("b_to_a.bps", "b.txt");
        });

        test("ff4lunar_to_ff4chocobo.bps", () => {
            assertPatchChecksum("ff4lunar_to_ff4chocobo.bps", "ff4lunar.spc");
        });
    });

    test("a_to_a.bps", () => {
        assertPatch("a_to_a.bps", "a.txt", "a.txt");
    });

    test("source_read.bps", () => {
        assertPatch("source_read.bps", "a.txt", "a.txt");
    });

    test("target_read.bps", () => {
        assertPatch("target_read.bps", "b.txt", "a_small.txt");
    });

    test("source_copy.bps", () => {
        assertPatch("source_copy.bps", "a.txt", "ba.txt");
    });

    test("target_copy.bps", () => {
        assertPatch("target_copy.bps", "b.txt", "a.txt");
    });

    test("a_to_a_malformed.bps", () => {
        const patch = readDataFile("a_to_a_malformed.bps");

        const base = readDataFile("a.txt");

        assert.throws(() => applyBPS(base, patch), MalformedPatchError);
    });

    test("a_to_a.bps (wrong input size)", () => {
        const patch = readDataFile("a_to_a.bps");

        const actualBase = readDataFile("a.txt");
        const wrongBase = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);

        const expected = new WrongInputSizeError(actualBase.length, wrongBase.length);

        assert.throws(() => applyBPS(wrongBase, patch), expected);
    });

    test("a_to_a.bps (wrong input file)", () => {
        const patch = readDataFile("a_to_a.bps");

        const actualBase = readDataFile("a.txt");
        const wrongBase = readDataFile("b.txt");

        const expected = new WrongInputChecksumError(crc32(actualBase), crc32(wrongBase));

        assert.throws(() => applyBPS(wrongBase, patch), expected);
    });

    test("b_to_a.bps", () => {
        assertPatch("b_to_a.bps", "b.txt", "a.txt");
    });

    test("ff4lunar_to_ff4chocobo.bps", () => {
        assertPatch("ff4lunar_to_ff4chocobo.bps", "ff4lunar.spc", "ff4chocobo.spc");
    });

    test("OLDC2017.bps", (t) => {
        assertPatchROM(
            t,
            "OLDC2017.bps",
            "Super Mario World (U) [!].sfc",
            "9a3b61c2f5c592197714fcd3099364318e510aacb6ec152c3035656e75c271b1"
        );
    });

    test("super2toad.bps", (t) => {
        assertPatchROM(
            t,
            "super2toad.bps",
            "Super Mario Bros. 2 (U) (PRG0) [!].nes",
            "8f4f37cbe81ebeaef341b7bbe4131dc8f5dbd0c653a0070c5ee9787b0593fd48"
        );
    });
});
