import * as assert from "node:assert/strict";
import * as crypto from "node:crypto";

export function assertBytesEqual(actual, expected) {
    assert.strictEqual(actual.length, expected.length);

    for (let i = 0; i < actual.length; i++) {
        assert.strictEqual(actual[i], expected[i]);
    }
}

export function assertHashEqual(actual, expectedHash) {
    assert.strictEqual(crypto.hash("sha256", actual), expectedHash);
}
