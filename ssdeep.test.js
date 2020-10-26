var assert = require('assert');
var fs = require('fs');
var path = require('path');
var ssdeep = require('.');

var NUM_OF_SAMPLES = 3;

describe('ssdeep', function() {
    for (var i=1; i<=NUM_OF_SAMPLES; i++) {
        var paddedId = (i < 10) ? '0'+i : i+'';
        var basePath = path.resolve(__dirname, 'test', 'sample-'+paddedId);
        it('produces the correct digest for ' + basePath + '.dat', function() {
            var sampleData = fs.readFileSync(basePath + '.dat');
            var expectedHash = fs.readFileSync(basePath + '.hash').toString();
            var actualHash = ssdeep.digest(sampleData);
            assert.strictEqual(actualHash, expectedHash);
        });
    }
});
