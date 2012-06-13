var keys = Object.keys,
    floor = Math.floor,
    isArray = Array.isArray;

// size lookup table
function sizeof_logic(obj){
    switch(obj){
        case 0xc0:
        case 0xc2:
        case 0xc3:
            return 1;
            break;
    }

    return 0;
}

function sizeof_number(obj){
    switch(obj){
        case 0x00:
        case 0xe0:
            return 1;
            break;
        case 0xcc:
        case 0xd0:
            return 2;
            break;
        case 0xcd:
        case 0xd1:
            return 3;
            break;
        case 0xce:
        case 0xd2:
            return 5;
            break;
        case 0xcb:
            return 9;
            break;
    }

    return 0;
}

function sizeof_raw(obj){
    switch(obj){
        case 0xa0: return 1;
        case 0xda: return 3;
        case 0xdb: return 5;
    }

    return 0;
}

function sizeof_array(obj){
    switch(obj){
        case 0x90: return 1;
        case 0xdc: return 3;
        case 0xdd: return 5;
    }

    return 0;
}

function sizeof_map(obj){
    switch(obj){
        case 0x80: return 1;
        case 0xde: return 3;
        case 0xdf: return 5;
    }

    return 0;
}

function type(obj){
    switch(typeof obj){
        case "string":
            var size = obj.length;
            if(size < 32){
                return 0xa0;
            }else if(size < 0x10000){
                return 0xda;
            }else if(size < 0x100000000){
                return 0xdb;
            }
        case "boolean":
            if(obj === true)
                return 0xc3;
            else
                return 0xc2;
        case "number":
            // TODO: Take a reserved value for NaN and Inf
            if(obj !== obj){
                return "nan";
            }else if(obj === Infinity){
                return "infinity";
            }else if(floor(obj) === obj){
                if(obj < 0){
                    if(obj >= -32){
                        return 0xe0;
                    }else if(obj > -0x80){
                        return 0xd0;
                    }else if(obj > -0x8000){
                        return 0xd1;
                    }else if(obj > -0x80000000){
                        return 0xd2;
                    }else{
                        return 0xd3;
                    }
                }else{
                    if(obj < 0x80){
                        return 0x00;
                    }else if(obj < 0x100){
                        return 0xcc;
                    }else if(obj < 0x10000){
                        return 0xcd;
                    }else if(obj < 0x100000000){
                        return 0xce;
                    }else{
                        return 0xcf;
                    }
                }
            }else{
                return 0xcb;
            }
        case "object":
            if(obj == null){
                return 0xc0;
            }else if(isArray(obj)){
                var size = obj.length;
                if(size < 16){
                    return 0x90;
                }else if(size < 0x10000){
                    return 0xdc;
                }else if(size < 0x100000000){
                    return 0xdd;
                }
            }else{
                var size = keys(obj).length;
                if(size < 16){
                    return 0x80;
                }else if(size < 0x10000){
                    return 0xde;
                }else if(size < 0x100000000){
                    return 0xdf;
                }
            }
        case "undefined":
            return 0xc0;
        default:
            throw new Error("unknow type " + obj);
    }
}

function fastType(obj){
    if(typeof obj == "object"){
        if(obj == null){
            return 0xc0;
        }else if(isArray(obj)){
            return 0x90;
        }else{
            return 0x80;
        }
    }

    return 0x00;
}

function walk(obj, cb){
    var disc = type(obj),
        acc = [];

    cb(acc, obj, null);

    if(sizeof_map(disc)){
        for(var key in obj){
            cb(acc, null, key);
            var res = walk(obj[key], cb);
            for(var i = 0; i < res.length; i++){
                acc.push(res[i]);
            }
        }
    }else if(sizeof_array(disc)){
        for(var i = 0; i < obj.length; i++){
            var res = walk(obj[i], cb);
            for(var j = 0; j < res.length; j++){
                acc.push(res[j]);
            }
        }
    }

    return acc;
}

function pack(obj){
    function cb(acc, node, key){
        var disc = type(node), ssize;

        if(key){
            var k = pack(key);
            acc.push(k);
            totalLength += k.length;
            return;
        }else if(ssize = sizeof_map(disc)){
            var buf = new Buffer(ssize)
                size = keys(node).length;

            switch(disc){
                case 0x80:
                    buf[0] = 0x80 | size;
                    break;
                case 0xde:
                    buf[0] = 0xde;
                    buf.writeUInt16BE(size, 1);
                    break;
                case 0xdf:
                    buf[0] = 0xdf;
                    buf.writeUInt32BE(size, 1);
                    break;
            }

            acc.push(buf);
            totalLength += ssize;
            return;
        }else if(ssize = sizeof_array(disc)){
            var buf = new Buffer(ssize),
                size = node.length;

            switch(disc){
                case 0x90:
                    buf[0] = 0x90 | size;
                    break;
                case 0xdc:
                    buf[0] = 0xdc;
                    buf.writeUInt16BE(size, 1);
                    break;
                case 0xdd:
                    buf[0] = 0xdd;
                    buf.writeUInt32BE(size, 1);
                    break;
            }

            acc.push(buf);
            totalLength += ssize;
            return;
        }else if(ssize = sizeof_raw(disc)){
            var size = Buffer.byteLength(node),
                buf = new Buffer(size + ssize);

            switch(disc){
                case 0xa0:
                    buf[0] = 0xa0 | size;
                    break;
                case 0xda:
                    buf[0] = 0xda;
                    buf.writeUInt16BE(size, 1);
                    break;
                case 0xdb:
                    buf[0] = 0xdb;
                    buf.writeUInt32BE(size, 1);
            }

            buf.write(node, ssize);
            acc.push(buf);
            totalLength += ssize + size;
            return;
        }else if(ssize = sizeof_number(disc)){
            var buf = new Buffer(ssize);

            switch(disc){
                case 0x00:
                case 0xe0:
                    buf[0] = node;
                    break;
                case 0xcb:
                    buf[0] = 0xcb;
                    buf.writeDoubleBE(node, 1);
                    break;
                case 0xcc:
                    buf[0] = 0xcc;
                    buf.writeUInt8(node, 1);
                    break;
                case 0xcd:
                    buf[0] = 0xcd;
                    buf.writeUInt16BE(node, 1);
                    break;
                case 0xce:
                    buf[0] = 0xce;
                    buf.writeUInt32BE(node, 1);
                    break;
                case 0xd0:
                    buf[0] = 0xd0;
                    buf.writeInt8(node, 1);
                    break;
                case 0xd1:
                    buf[0] = 0xd1;
                    buf.writeInt16BE(node, 1);
                    break;
                case 0xd2:
                    buf[0] = 0xd2;
                    buf.writeInt32BE(node, 1);
                    break;
            }

            acc.push(buf);
            totalLength += ssize;
            return;
        }else if(sizeof_logic(disc)){
            var buf = new Buffer(1);

            switch(disc){
                case 0xc0:
                    buf[0] = 0xc0;
                    break;
                case 0xc2:
                    buf[0] = 0xc2;
                    break;
                case 0xc3:
                    buf[0] = 0xc3;
                    break;
            }

            acc.push(buf);
            totalLength += 1;
            return;
        }
    };

    var totalLength = 0,
        bufferArray = walk(obj, cb),
        buffer = new Buffer(totalLength),
        pos = 0;

    for(var i = 0; i < bufferArray.length; i++){
        var buf = bufferArray[i];
        buf.copy(buffer, pos);
        pos += buf.length;
    }

    return buffer;
}

function reverseType(obj){
    if(obj <= 0x7f){
        return 0x00;
    }else if(obj <= 0x8f){
        return 0x80;
    }else if(obj <= 0x9f){
        return 0x90;
    }else if(obj <= 0xbf){
        return 0xa0;
    }else if(obj >= 0xe0 && obj <= 0xff){
        return 0xe0;
    }

    return obj;
}

// returns the size of each element in the array or map
function sizeof_variable(buf, type, ssize){
    var offset = 0, lengths = [];

    switch(type){
        case 0xdd:
        case 0xdf:
            offset += 3;
        case 0xdc:
        case 0xde:
            offset += 2;
        case 0x90:
        case 0x80:
            offset += 1;
            break;
    }

    if(sizeof_map(type))
        ssize *= 2;

    for(var i = 0; i < ssize; i++){
        var marker = reverseType(buf[offset]),
            size = sizeof_number(marker) || sizeof_logic(marker);

        if(!size){
            var psize;
            if(psize = sizeof_raw(marker)){
                var len;

                switch(marker){
                    case 0xa0:
                        len = buf[offset] ^ 0xa0;
                        break;
                    case 0xda:
                        len = buf.readUInt16BE(offset + 1);
                        break;
                    case 0xdb:
                        len = buf.readUInt32BE(offset + 1);
                        break;
                }

                size = len + psize;
            }else if(psize = (sizeof_array(marker) || sizeof_map(marker))){
                var len;

                switch(marker){
                    case 0x90:
                        len = buf[offset] ^ 0x90;
                        break;
                    case 0x90:
                        len = buf[offset] ^ 0x80;
                        break;
                    case 0xdc:
                    case 0xde:
                        len = buf.readUInt16BE(offset + 1);
                        break;
                    case 0xdd:
                    case 0xdf:
                        len = buf.readUInt32BE(offset + 1);
                        break;
                }

                var array = sizeof_variable(buf.slice(offset), marker, len);

                for(var j = 0; j < array.length; j++){
                    size += array[j];
                }

                size += psize;
            }
        }

        lengths.push(size);
        offset += size;
    }

    return lengths;
}

function unpack(buf){
    var disc = reverseType(buf[0]);

    if(sizeof_map(disc)){
        var map = {},
            lengths, len,
            start = sizeof_map(disc),
            end = start;

        switch(disc){
            case 0x80:
                len = buf[0] ^ 0x80;
                break;
            case 0xde:
                len = buf.readUInt16BE(1);
                break;
            case 0xdf:
                len = buf.readUInt32BE(1);
                break;
        }

        lengths = sizeof_variable(buf, disc, len);

        for(var i = 0; i < len*2; i+=2){
            end += lengths[i];
            var key = unpack(buf.slice(start, end));
            start = end;
            end += lengths[i+1];
            var val = unpack(buf.slice(start, end));
            start = end;

            map[key] = val;
        }

        return map;
    }else if(sizeof_array(disc)){
        var array = [],
            lengths, len,
            start = sizeof_array(disc),
            end = start;

        switch(disc){
            case 0x90:
                len = buf[0] ^ 0x90;
                break;
            case 0xdc:
                len = buf.readUInt16BE(1);
                break;
            case 0xdd:
                len = buf.readUInt32BE(1);
                break;
        }

        lengths = sizeof_variable(buf, disc, len);

        for(var i = 0; i < len; i++){
            end += lengths[i];
            array.push(unpack(buf.slice(start, end)));
            start = end;
        }

        return array;
    }else if(sizeof_raw(disc)){
        return buf.toString("utf8", sizeof_raw(disc));
    }else if(sizeof_number(disc)){
        switch(disc){
            case 0x00:
                return buf.readUInt8(0);
            case 0xcb:
                return buf.readDoubleBE(1);
            case 0xcc:
                return buf.readUInt8(1);
            case 0xcd:
                return buf.readUInt16BE(1);
            case 0xce:
                return buf.readUInt32BE(1);
            case 0xd0:
                return buf.readInt8(1);
            case 0xd1:
                return buf.readInt16BE(1);
            case 0xd2:
                return buf.readInt32BE(1);
            case 0xe0:
                return buf.readInt8(0)
        }
    }else if(sizeof_logic(disc)){
        switch(disc){
            case 0xc0:
                return null;
            case 0xc2:
                return false;
            case 0xc3:
                return true;
        }
    }
}

exports.pack = pack;
exports.unpack = unpack;
