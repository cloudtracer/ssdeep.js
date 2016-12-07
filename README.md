# ssdeep.js - Pure JS implementation of ssdeep

JavaScript library for generating and comparing ssdeep hashes within javascript. Module is written in pure javascript so it will work in NodeJS and the browser.

This code a modified version of [huwenshou's](https://github.com/huwenshuo) ctph.js library with SSDEEP compatible output.


# Install

```
npm install ssdeep.js
```

# Example

```js
var ssdeep = require("ssdeep.js");

var eicarstring = ssdeep.digest("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*");
console.log("ssdeep1: ", eicarstring);

eicarstring2 = ssdeep.digest("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-THREATPINCH-ANTIVIRUS-TEST-FILE!$H+H*");
console.log("ssdeep2: ", eicarstring2);

console.log("Similarity:", ssdeep.similarity(eicarstring, eicarstring2));

```

### OUTPUT:
```
ssdeep1:  3:a+JraNvsgzsVqSwHq9:tJuOgzsko
ssdeep2:  3:a+JraNvsg7QhyqzWwHq9:tJuOg7Q4Wo
Similarity: 70
```

# License
MIT
