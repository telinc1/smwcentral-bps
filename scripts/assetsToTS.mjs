import * as fs from "node:fs";
import * as path from "node:path";

const FROM_DIR = path.resolve(import.meta.dirname, "..", "assets");
const TO_DIR = path.resolve(import.meta.dirname, "..", "src", "assets");

const code = (base64) => `// AUTO-GENERATED, DO NOT EDIT MANUALLY
// Generate with:
// $ node scripts/assetsToTS.mjs

import "core-js/proposals/array-buffer-base64.js";

// @ts-expect-error
export default Uint8Array.fromBase64(${JSON.stringify(base64)});
`;

for (const file of fs.readdirSync(FROM_DIR)) {
    const base64 = fs.readFileSync(path.join(FROM_DIR, file)).toString("base64");

    fs.writeFileSync(path.join(TO_DIR, `${file}.ts`), code(base64));
}
