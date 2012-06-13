var msgpack = require("../"),
    assert = require("assert");

console.log(msgpack.unpack(msgpack.pack([1, 2, 3, 4])));
console.log(msgpack.unpack(msgpack.pack(
    [1, 2, 3, 4, 5, 6, 7,
     8, 9, 10, 11, 12, 13,
     14, 15, 16, 17, 18, 19, 20]
)));

console.log(msgpack.unpack(msgpack.pack("hello world!")));
console.log(msgpack.unpack(msgpack.pack("abcdefghijklmnopqrstuvwxyandznowiknowmyabcsnext")));

var o = { a: { b: [-1, -128] }, c: "hey", 2: 3 };
console.log(msgpack.unpack(msgpack.pack(o)));

