# TODO

* Improve performance? Currently hovering around
14000ms when packing and 4800ms unpacking, which
sucks. Native C++ does it way faster at around
4500ms and 1200ms respectively.

```
msgpack pack:   13998 ms
msgpack unpack: 4701 ms
json    pack:   1112 ms
json    unpack: 592 ms

msgpack pack:   13834 ms
msgpack unpack: 4826 ms
json    pack:   1209 ms
json    unpack: 527 ms

msgpack pack:   13967 ms
msgpack unpack: 4690 ms
json    pack:   1193 ms
json    unpack: 647 ms
```
