import {applyBPS, getExpectedChecksum, WrongInputError} from "./bps.js";
import {crc32} from "./crc32.js";

import {
    PATCH_REV_0_TO_REV_A,
    PATCH_REV_A_TO_REV_0,
    REV_0 as SMB2_REV_0,
    REV_A as SMB2_REV_A,
    VERSIONS as SMB2_VERSIONS,
} from "./smb2.js";

export interface AdaptiveOptions {
    /**
     * If true, try to adapt a SNES ROM with a 512-byte copier (SMC) header.
     */
    trySMC: boolean;

    /**
     * If true, try to adapt a Super Mario Bros. 2 ROM with different versions.
     */
    trySMB2: boolean;
}

export function adaptiveApplyBPS(
    rom: Uint8Array,
    patch: Uint8Array,
    {trySMB2 = true, trySMC = true}: Partial<AdaptiveOptions> = {}
): Uint8Array {
    let originalWrongInputError: WrongInputError;

    // Best-case: the patch is intended for this ROM (also validates the patch)
    try {
        return applyBPS(rom, patch);
    } catch (error) {
        if (error instanceof WrongInputError) {
            originalWrongInputError = error;
        } else {
            throw error;
        }
    }

    // Maybe the patch is intended for a version of SMB2?
    // (this u32at is safe, as the patch itself has already been validated above)
    const requiredCode = getExpectedChecksum(patch);

    if (trySMB2 && SMB2_VERSIONS.has(requiredCode)) {
        const requiredVersion = SMB2_VERSIONS.get(requiredCode)!;

        const unheaderedRom = new Uint8Array(rom.buffer, 16);
        const unheaderedRomCode = crc32(unheaderedRom);

        // Just fix the header.
        if (unheaderedRomCode === requiredVersion.unheaderedCode) {
            const reheaderedRom = Uint8Array.from(rom);
            reheaderedRom.set(requiredVersion.header);

            return applyBPS(reheaderedRom, patch);
        }

        // Convert from Rev 0 to Rev A.
        if (
            unheaderedRomCode === SMB2_REV_0.unheaderedCode &&
            requiredVersion.unheaderedCode === SMB2_REV_A.unheaderedCode
        ) {
            const reheaderedRom = Uint8Array.from(rom);
            reheaderedRom.set(SMB2_REV_0.header);

            const revisedRom = applyBPS(reheaderedRom, PATCH_REV_0_TO_REV_A);

            const reheaderedRevisedRom = Uint8Array.from(revisedRom);
            reheaderedRevisedRom.set(requiredVersion.header);

            return applyBPS(reheaderedRevisedRom, patch);
        }

        // Convert from Rev A to Rev 0.
        if (
            unheaderedRomCode === SMB2_REV_A.unheaderedCode &&
            requiredVersion.unheaderedCode === SMB2_REV_0.unheaderedCode
        ) {
            const reheaderedRom = Uint8Array.from(rom);
            reheaderedRom.set(SMB2_REV_A.header);

            const revisedRom = applyBPS(reheaderedRom, PATCH_REV_A_TO_REV_0);

            const reheaderedRevisedRom = Uint8Array.from(revisedRom);
            reheaderedRevisedRom.set(requiredVersion.header);

            return applyBPS(reheaderedRevisedRom, patch);
        }
    }

    // Maybe a headered SNES ROM? Try to skip the first 512 bytes for patching
    if (trySMC) {
        try {
            const result = applyBPS(new Uint8Array(rom.buffer, 512), patch);

            const buffer = new Uint8Array(result.length + 512); // create buffer large enough for rom and header
            buffer.set(new Uint8Array(rom.buffer, 0, 512)); // copy header
            buffer.set(result, 512); // copy rom data

            return buffer;
        } catch (error) {
            // Fallthrough if wrong ROM
            if (!(error instanceof WrongInputError)) {
                throw error;
            }
        }
    }

    // None of our checks worked, this patch is not intended for this ROM
    throw originalWrongInputError;
}
