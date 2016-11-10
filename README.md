# ssdeep.js - Pure JS implementation of ssdeep

JavaScript library for calculating context triggered piecewise hash(CTPH, also called fuzzy hashing). CTPH can be used to identify similar or almost identical content(text,img,etc.), the library can works both on NodeJS and browser.

This code a modified version of [huwenshou's](https://github.com/huwenshuo) ctph.js library with SSDEEP compatible output.

More information about CTPH: [Identifying almost identical files using context triggered piecewise hashing](http://dfrws.org/2006/proceedings/12-Kornblum.pdf "Title")

# Install

```
npm install ssdeep.js
```

# Example

```js
var ssdeep = require("./ssdeep.js");

var eicarstring = ssdeep.digest("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*");
console.log("ssdeep1: ", eicarstring);

eicarstring2 = ssdeep.digest("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-THREATPINCH-ANTIVIRUS-TEST-FILE!$H+H*");
console.log("ssdeep2: ", eicarstring2);

console.log("Similarity:", ssdeep.similarity(eicarstring, eicarstring2));

OUTPUT:
ssdeep1:  3:a+JraNvsgzsVqSwHq9:tJuOgzsko
ssdeep2:  3:a+JraNvsg7QhyqzWwHq9:tJuOg7Q4Wo
Similarity: 70


```

# License
MIT
