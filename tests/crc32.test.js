import {describe, it} from "node:test";
import {crc32 as nodeCRC32} from "node:zlib";

import {crc32} from "../dist/index.js";

import {readFile} from "./utils/file.js";

describe("crc32", () => {
    it("works for empty data", (t) => {
        const data = new Uint8Array([]);
        t.assert.strictEqual(crc32(data), nodeCRC32(data));
    });

    it("works for a.txt", (t) => {
        const data = readFile("./data/a.txt");
        t.assert.strictEqual(crc32(data), nodeCRC32(data));
    });

    it("works for b.txt", (t) => {
        const data = readFile("./data/b.txt");
        t.assert.strictEqual(crc32(data), nodeCRC32(data));
    });
});
