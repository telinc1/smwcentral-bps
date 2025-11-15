import * as assert from "node:assert/strict";
import {describe, it} from "node:test";

import {adaptiveApplyBPS, WrongInputError} from "../dist/index.js";

import {assertBytesEqual, assertHashEqual} from "./utils/bps.js";
import {readDataFile} from "./utils/file.js";
import {hasROM, readROM} from "./utils/roms.js";

function testPatchesROM(patchName, baseROM, options, expectedHash) {
    return (t) => {
        if (!hasROM(baseROM)) {
            t.skip(`base ROM "${baseROM}" not available`);
            return;
        }

        const patch = readDataFile(patchName);
        const base = readROM(baseROM);

        assertHashEqual(adaptiveApplyBPS(base, patch, options), expectedHash);
    };
}

function testFailsToPatchROM(patchName, baseROM, options) {
    return (t) => {
        if (!hasROM(baseROM)) {
            t.skip(`base ROM "${baseROM}" not available`);
            return;
        }

        const patch = readDataFile(patchName);
        const base = readROM(baseROM);

        assert.throws(() => adaptiveApplyBPS(base, patch, options), WrongInputError);
    };
}

/**
 * Read as "all options set to ..., except ..."
 *
 * Used to verify that a particular option is, even if more options are added in the future,
 * (a) by itself sufficient to allow a patch to work (set all others to false), or
 * (b) necessary to allow a patch to work (set all other to true)
 */
function makeOptions(all, except = {}) {
    return {
        trySMB2: all,
        trySMC: all,
        ...except,
    };
}

describe("adaptive", () => {
    it("patches matching files", () => {
        const patch = readDataFile("ff4lunar_to_ff4chocobo.bps");

        const base = readDataFile("ff4lunar.spc");
        const expected = readDataFile("ff4chocobo.spc");

        assertBytesEqual(adaptiveApplyBPS(base, patch, makeOptions(false)), expected);
        assertBytesEqual(adaptiveApplyBPS(base, patch, makeOptions(true)), expected);
    });

    describe("SNES ROMs", () => {
        it(
            "doesn't need to adapt headerless SNES ROMs",
            testPatchesROM(
                "OLDC2017.bps",
                "Super Mario World (U) [!].sfc",
                makeOptions(false),
                "9a3b61c2f5c592197714fcd3099364318e510aacb6ec152c3035656e75c271b1"
            )
        );

        it(
            "adapts headered SNES ROMs to headerless SNES ROMs, creating a headered output",
            testPatchesROM(
                "OLDC2017.bps",
                "Super Mario World (U) [!].smc",
                makeOptions(false, {trySMC: true}),
                "bc75bda2fad625958807a64f1a7a941ea567197f346916ce4a85669d1da89908",
            ),
        );

        it(
            "doesn't adapt headered SNES ROMs to headerless SNES ROMs if told not to",
            testFailsToPatchROM("OLDC2017.bps", "Super Mario World (U) [!].smc", makeOptions(true, {trySMC: false}))
        );

        it("doesn't try to read files out of bounds", (t) => {
            const patch = readDataFile("OLDC2017.bps");
            const base = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

            assert.throws(() => adaptiveApplyBPS(base, patch, makeOptions(false, {trySMC: true})), WrongInputError);
        });
    });

    const smb2_rev0 = "Super Mario Bros. 2 (U) (PRG0) [!].nes";
    const smb2_rev0_nes_2 = "Super Mario Bros. 2 (USA).nes";
    const smb2_revA = "Super Mario Bros. 2 (USA) (Rev A).nes";

    describe("Super Mario Bros. 2, patch based on Rev 0", () => {
        const rev0Patch = "super2toad.bps";
        const expectedHash = "8f4f37cbe81ebeaef341b7bbe4131dc8f5dbd0c653a0070c5ee9787b0593fd48";

        it("doesn't need to adapt Rev 0", testPatchesROM(rev0Patch, smb2_rev0, makeOptions(false), expectedHash));

        it(
            "adapts Rev 0 (NES 2)",
            testPatchesROM(rev0Patch, smb2_revA, makeOptions(false, {trySMB2: true}), expectedHash)
        );

        it("adapts Rev A", testPatchesROM(rev0Patch, smb2_revA, makeOptions(false, {trySMB2: true}), expectedHash));

        it(
            "doesn't adapt Rev 0 (NES 2) if told not to",
            testFailsToPatchROM(rev0Patch, smb2_rev0_nes_2, makeOptions(true, {trySMB2: false}))
        );

        it(
            "doesn't adapt Rev A if told not to",
            testFailsToPatchROM(rev0Patch, smb2_revA, makeOptions(true, {trySMB2: false}))
        );
    });

    describe("Super Mario Bros. 2, patch based on Rev 0 (NES 2)", () => {
        const rev0nes2Patch = "boaf.bps";
        const expectedHash = "95fdded2b37c7bd2e4ca59b05d5b635d32d69f3fe6885e467b7dce479eb8e19e";

        it(
            "doesn't need to adapt Rev 0 (NES 2)",
            testPatchesROM(rev0nes2Patch, smb2_rev0_nes_2, makeOptions(false), expectedHash)
        );

        it("adapts Rev 0", testPatchesROM(rev0nes2Patch, smb2_rev0, makeOptions(false, {trySMB2: true}), expectedHash));

        it("adapts Rev A", testPatchesROM(rev0nes2Patch, smb2_revA, makeOptions(false, {trySMB2: true}), expectedHash));

        it(
            "doesn't adapt Rev 0 if told not to",
            testFailsToPatchROM(rev0nes2Patch, smb2_rev0, makeOptions(true, {trySMB2: false}))
        );

        it(
            "doesn't adapt Rev A if told not to",
            testFailsToPatchROM(rev0nes2Patch, smb2_revA, makeOptions(true, {trySMB2: false}))
        );
    });

    // SMB2 Rev A patch
    describe("Super Mario Bros. 2, patch based on Rev A", () => {
        const revAPatch = "TreeTopTechDemo-rev1.bps";
        const expectedHash = "db483fae41f46f2ec39c2949147d28676944dd630e42bc6dda6ef642535cd5a0";

        it("doesn't need to adapt Rev A", testPatchesROM(revAPatch, smb2_revA, makeOptions(false), expectedHash));

        it("adapts Rev 0", testPatchesROM(revAPatch, smb2_rev0, makeOptions(false, {trySMB2: true}), expectedHash));

        it(
            "adapts Rev 0 (NES 2)",
            testPatchesROM(revAPatch, smb2_rev0_nes_2, makeOptions(false, {trySMB2: true}), expectedHash)
        );

        it("doesn't adapt Rev 0", testFailsToPatchROM(revAPatch, smb2_rev0, makeOptions(true, {trySMB2: false})));

        it(
            "doesn't adapt Rev 0 (NES 2)",
            testFailsToPatchROM(revAPatch, smb2_rev0_nes_2, makeOptions(true, {trySMB2: false}))
        );
    });
});
