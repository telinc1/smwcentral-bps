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

import {readFile} from "./utils/file.js";
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

describe("bps", () => {
    describe("getExpectedChecksum", () => {
        test("a_to_a.bps", () => {
            const a = readFile("./data/a.txt");
            const patch = readFile("./data/a_to_a.bps");

            assert.strictEqual(getExpectedChecksum(patch), crc32(a));
        });

        test("b_to_a.bps", () => {
            const b = readFile("./data/b.txt");
            const patch = readFile("./data/b_to_a.bps");

            assert.strictEqual(getExpectedChecksum(patch), crc32(b));
        });

        test("ff4lunar_to_ff4chocobo.bps", () => {
            const ff4lunar = readFile("./data/ff4lunar.spc");
            const patch = readFile("./data/ff4lunar_to_ff4chocobo.bps");

            assert.strictEqual(getExpectedChecksum(patch), crc32(ff4lunar));
        });
    });

    test("a_to_a.bps", () => {
        const patch = readFile("./data/a_to_a.bps");

        const base = readFile("./data/a.txt");
        const expected = base;

        assertBytesEqual(applyBPS(base, patch), expected);
    });

    test("source_read.bps", () => {
        const patch = readFile("./data/source_read.bps");

        const base = readFile("./data/a.txt");
        const expected = base;

        assertBytesEqual(applyBPS(base, patch), expected);
    });

    test("target_read.bps", () => {
        const patch = readFile("./data/target_read.bps");

        const base = readFile("./data/b.txt");
        const expected = readFile("./data/a_small.txt");

        assertBytesEqual(applyBPS(base, patch), expected);
    });

    test("source_copy.bps", () => {
        const patch = readFile("./data/source_copy.bps");

        const base = readFile("./data/a.txt");
        const expected = readFile("./data/ba.txt");

        assertBytesEqual(applyBPS(base, patch), expected);
    });

    test("target_copy.bps", () => {
        const patch = readFile("./data/target_copy.bps");

        const base = readFile("./data/b.txt");
        const expected = readFile("./data/a.txt");

        assertBytesEqual(applyBPS(base, patch), expected);
    });

    test("a_to_a_malformed.bps", () => {
        const patch = readFile("./data/a_to_a_malformed.bps");

        const base = readFile("./data/a.txt");

        assert.throws(() => applyBPS(base, patch), MalformedPatchError);
    });

    test("a_to_a.bps (wrong input size)", () => {
        const patch = readFile("./data/a_to_a.bps");

        const actualBase = readFile("./data/a.txt");
        const wrongBase = new Uint8Array([1, 2, 3]);

        const expected = new WrongInputSizeError(actualBase.length, wrongBase.length);

        assert.throws(() => applyBPS(wrongBase, patch), expected);
    });

    test("a_to_a.bps (wrong input file)", () => {
        const patch = readFile("./data/a_to_a.bps");

        const actualBase = readFile("./data/a.txt");
        const wrongBase = readFile("./data/b.txt");

        const expected = new WrongInputChecksumError(crc32(actualBase), crc32(wrongBase));

        assert.throws(() => applyBPS(wrongBase, patch), expected);
    });

    test("b_to_a.bps", () => {
        const patch = readFile("./data/b_to_a.bps");

        const base = readFile("./data/b.txt");
        const expected = readFile("./data/a.txt");

        assertBytesEqual(applyBPS(base, patch), expected);
    });

    test("ff4lunar_to_ff4chocobo.bps", () => {
        const patch = readFile("./data/ff4lunar_to_ff4chocobo.bps");

        const base = readFile("./data/ff4lunar.spc");
        const expected = readFile("./data/ff4chocobo.spc");

        assertBytesEqual(applyBPS(base, patch), expected);
    });

    test("OLDC2017.bps", (t) => {
        const baseROM = "Super Mario World (U) [!].sfc";

        if (!hasROM(baseROM)) {
            t.skip(`base ROM "${baseROM}" not available`);
            return;
        }

        const patch = readFile("./data/OLDC2017.bps");
        const base = readROM(baseROM);
        const expectedHash = "9a3b61c2f5c592197714fcd3099364318e510aacb6ec152c3035656e75c271b1";

        assertHashEqual(applyBPS(base, patch), expectedHash);
    });

    test("super2toad.bps", (t) => {
        const baseROM = "Super Mario Bros. 2 (U) (PRG0) [!].nes";

        if (!hasROM(baseROM)) {
            t.skip(`base ROM "${baseROM}" not available`);
            return;
        }

        const patch = readFile("./data/super2toad.bps");
        const base = readROM(baseROM);
        const expectedHash = "8f4f37cbe81ebeaef341b7bbe4131dc8f5dbd0c653a0070c5ee9787b0593fd48";

        assertHashEqual(applyBPS(base, patch), expectedHash);
    });
});
