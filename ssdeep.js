(function () {
    var ssdeep = {};
    var isBrowser = false;
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = ssdeep;
    } else {//for browser
        this.ssdeep = ssdeep;
        isBrowser = true;
    }

    var HASH_PRIME = 16777619;
    var HASH_INIT = 671226215;
    var ROLLING_WINDOW = 7;
    var MAX_LENGTH = 64; // Max individual hash length in characters
    var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    //refer http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    function toUTF8Array (str) {
      var out = [], p = 0;
      for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 128) {
          out[p++] = c;
        } else if (c < 2048) {
          out[p++] = (c >> 6) | 192;
          out[p++] = (c & 63) | 128;
        } else if (
            ((c & 0xFC00) == 0xD800) && (i + 1) < str.length &&
            ((str.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
          // Surrogate Pair
          c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
          out[p++] = (c >> 18) | 240;
          out[p++] = ((c >> 12) & 63) | 128;
          out[p++] = ((c >> 6) & 63) | 128;
          out[p++] = (c & 63) | 128;
        } else {
          out[p++] = (c >> 12) | 224;
          out[p++] = ((c >> 6) & 63) | 128;
          out[p++] = (c & 63) | 128;
        }
      }
      return out;
    }

    /*
    * Add integers, wrapping at 2^32. This uses 16-bit operations internally
    * to work around bugs in some JS interpreters.
    */
    function safe_add (x, y) {
      var lsw = (x & 0xFFFF) + (y & 0xFFFF)
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
      return (msw << 16) | (lsw & 0xFFFF)
    }

    /*
      1000 0000
      1000 0000
      0000 0001
    */

    function safe_multiply(x, y) {
  		/*
  			a = a00 + a16
  			b = b00 + b16
  			a*b = (a00 + a16)(b00 + b16)
  				= a00b00 + a00b16 + a16b00 + a16b16

  			a16b16 overflows the 32bits
  		 */
     var xlsw = (x & 0xFFFF)
     var xmsw = (x >> 16) +(xlsw >> 16);
     var ylsw = (y & 0xFFFF)
     var ymsw = (y >> 16) +(ylsw >> 16);
  		var a16 = xmsw
  		var a00 = xlsw
  		var b16 = ymsw
  		var b00 = ylsw
  		var c16, c00
  		c00 = a00 * b00
  		c16 = c00 >>> 16

  		c16 += a16 * b00
  		c16 &= 0xFFFF		// Not required but improves performance
  		c16 += a00 * b16

  		xlsw = c00 & 0xFFFF
  		xmsw= c16 & 0xFFFF

  		return (xmsw << 16) | (xlsw & 0xFFFF)
  	}

    //FNV-1 hash
    function fnv (h, c) {
      return (safe_multiply(h,HASH_PRIME) ^ c)>>>0;
    }

    //Based on https://github.com/hiddentao/fast-levenshtein
    function levenshtein (str1, str2) {
        // base cases
        if (str1 === str2) return 0;
        if (str1.length === 0) return str2.length;
        if (str2.length === 0) return str1.length;

        // two rows
        var prevRow  = new Array(str2.length + 1),
            curCol, nextCol, i, j, tmp;

        // initialise previous row
        for (i=0; i<prevRow.length; ++i) {
            prevRow[i] = i;
        }

        // calculate current row distance from previous row
        for (i=0; i<str1.length; ++i) {
            nextCol = i + 1;

            for (j=0; j<str2.length; ++j) {
                curCol = nextCol;

                // substution
                nextCol = prevRow[j] + ( (str1.charAt(i) === str2.charAt(j)) ? 0 : 1 );
                // insertion
                tmp = curCol + 1;
                if (nextCol > tmp) {
                    nextCol = tmp;
                }
                // deletion
                tmp = prevRow[j + 1] + 1;
                if (nextCol > tmp) {
                    nextCol = tmp;
                }

                // copy current col value into previous (in preparation for next iteration)
                prevRow[j] = curCol;
            }

            // copy last col value into previous (in preparation for next iteration)
            prevRow[j] = nextCol;
        }
        return nextCol;
    }

    function RollHash () {
      this.rolling_window = new Array(ROLLING_WINDOW);
      this.h1 =  0
      this.h2 = 0
      this.h3 = 0
      this.n = 0
    }
    RollHash.prototype.update = function (c) {
      this.h2 = safe_add(this.h2, -this.h1);
      var mut = (ROLLING_WINDOW * c);
      this.h2 = safe_add(this.h2, mut) >>>0;
      this.h1 = safe_add(this.h1, c);

      var val = (this.rolling_window[this.n % ROLLING_WINDOW] || 0);
      this.h1 = safe_add(this.h1, -val) >>>0;
      this.rolling_window[this.n % ROLLING_WINDOW] = c;
      this.n++;

      this.h3 = this.h3 << 5;
      this.h3 = (this.h3 ^ c) >>>0;
    };
    RollHash.prototype.sum = function () {
      return (this.h1 + this.h2 + this.h3) >>>0;
    };

    function piecewiseHash (bytes, triggerValue) {
        var signatures = ['','', triggerValue];
        if (bytes.length === 0) {
            return signatures;
        }
        var h1 = HASH_INIT;
        var h2 = HASH_INIT;
        var rh = new RollHash();
        //console.log(triggerValue)
        for (var i = 0, len = bytes.length; i < len; i++) {
            var thisByte = bytes[i];

            h1 = fnv(h1, thisByte);
            h2 = fnv(h2, thisByte);

            rh.update(thisByte);

            if (signatures[0].length < (MAX_LENGTH-1) && rh.sum() % triggerValue === (triggerValue - 1)) {
                signatures[0] += B64.charAt(h1&63);
                h1 = HASH_INIT;
            }
            if (signatures[1].length < (MAX_LENGTH/2-1) && rh.sum() % (triggerValue * 2) === (triggerValue * 2 - 1)) {
                signatures[1] += B64.charAt(h2&63);
                h2 = HASH_INIT;
            }
        }
        signatures[0] += B64.charAt(h1&63);
        signatures[1] += B64.charAt(h2&63);
        return signatures;
    }

    function digest (bytes) {
        var bi = 3;
        while (bi*MAX_LENGTH < bytes.length) {
            bi *= 2;
        }

        var signatures;
        do {
            signatures = piecewiseHash(bytes, bi);
            bi = ~~(bi / 2);
        } while (bi > 3 && signatures[0].length < MAX_LENGTH/2);

        return signatures[2] + ':' + signatures[0] + ':' + signatures[1];
    }

    function matchScore (s1, s2) {
        var e = levenshtein(s1, s2);
        var r = 1 - e/Math.max(s1.length ,s2.length);
        return r * 100;
    }

    ssdeep.digest = function (data) {
        if (typeof data === 'string') {
            data = isBrowser ? toUTF8Array(data) : Buffer.from(data).toJSON().data;
        }
        return digest(data);
    };

    ssdeep.similarity = function (d1, d2) {
        var b1 = B64.indexOf(d1.charAt(0));
        var b2 = B64.indexOf(d2.charAt(0));
        if (b1 > b2) return arguments.callee(d2, d1);

        if (Math.abs(b1-b2) > 1) {
            return 0;
        } else if (b1 === b2) {
            return matchScore(d1.split(':')[1], d2.split(':')[1]);
        } else {
            return matchScore(d1.split(':')[2], d2.split(':')[1]);
        }
    };
})();
