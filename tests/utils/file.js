import * as fs from "node:fs";
import * as path from "node:path";

export function exists(name) {
    return fs.existsSync(path.resolve(import.meta.dirname, "..", name));
}

export function readFile(name) {
    return fs.readFileSync(path.resolve(import.meta.dirname, "..", name));
}

export function readDataFile(name) {
    return readFile(path.join("data", name));
}
