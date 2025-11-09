import * as crypto from "node:crypto";
import * as path from "node:path";

import {exists, readFile} from "./file.js";

export function hasROM(name) {
    const romPath = path.join("roms", name);
    const hashPath = path.join("roms", `${name}.sha256`);

    if (!exists(hashPath)) {
        throw new Error(`No hash stored for ROM "${name}"`);
    }

    if (!exists(romPath)) {
        return false;
    }

    const expectedHash = readFile(hashPath).toString("utf8").split(" ")[0];

    return crypto.hash("sha256", readFile(romPath)) === expectedHash;
}

export function readROM(name) {
    if (!hasROM(name)) {
        throw new Error(`ROM "${name}" not available`);
    }

    const romPath = path.join("roms", name);
    return readFile(romPath);
}
