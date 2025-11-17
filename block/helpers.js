    function uInt32LE(n) {
        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(n);
        return buf;
    }