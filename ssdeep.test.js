var assert = require('assert');
var fs = require('fs');
var path = require('path');
var ssdeep = require('.');

var NUM_OF_SAMPLES = 4;

function createTest(index) {
    var paddedId = (index < 10) ? '0'+index : index+'';
    var basePath = path.resolve(__dirname, 'test', 'sample-'+paddedId);
    it('produces the correct digest for ' + basePath + '.dat', function() {
        var sampleData = fs.readFileSync(basePath + '.dat');
        var expectedHash = fs.readFileSync(basePath + '.hash').toString();
        var actualHash = ssdeep.digest(sampleData);
        assert.strictEqual(actualHash, expectedHash);
    });
}

describe('ssdeep', function() {
    for (var i=1; i<=NUM_OF_SAMPLES; i++) {
        createTest(i);
    }
});
