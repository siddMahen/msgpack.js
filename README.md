# msgpack.js

An implementation of the MessagePack serialization protocol.

## Install

Get the source above. Not on `npm` yet due to a lack of testing.

## Usage

### msgpack.pack

Takes any javascript object which is non-circular and does not contain any functions,
and serializes it according to the MessagePack protocol. Returns a buffer containing
the serialized object.

```javascript
var pack = require("msgpack").pack;

console.log(pack({ a: 1 });

// <Buffer 81 a1 65 01>
```

### msgpack.unpack

Takes a buffer containing a MessagePack serialized object and converts
it into a native javascript object.

```javascript
var unpack = require("msgpack").unpack;

console.log(unpack(new Buffer([0x81, 0xa1, 0x65, 0x01])));

// { a: 1 }
```

## License

(The MIT License)

Copyright (C) 2012 by Siddharth Mahendraker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
