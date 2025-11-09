import * as fs from "node:fs";
import * as path from "node:path";

export function readFile(name) {
    return fs.readFileSync(path.resolve(import.meta.dirname, "..", name));
}
