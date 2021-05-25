// Type definitions for ssdeep.js
// Project: https://github.com/cloudtracer/ssdeep.js

// ssdeep digest
type Digest = string;

// Digests similarity (between 0 and 100)
type Similarity = number;

declare namespace ssdeep {
    function digest(data: string | number[] | Uint8Array): Digest;
    function similarity(d1: Digest, d2: Digest): Similarity;
}

export = ssdeep;
