#!/bin/bash

set -euo pipefail

sed -i -E 's/^export \{ default as ([^ ]+) \} from "[^"]+\.bps";$/export declare const \1: Uint8Array;/' dist/*.d.ts
