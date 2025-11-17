// partie transakcji są rozliczane co 10 min, te partie to blocki 
import {uInt32LE} from "./helpers.js"
import { sha256 } from "../wallet/helpers.js";

export class Block {
    constructor({
        version = 1, // Describes set of functions // 4 bytes little-endian
        prevBlock, // hash of previous block // 32 bytes big-endian
        merkleRoot, // (Korzeń drzewa skrótów) encodes all transactions to hash// 32 bytes big-endian
        timestamp = Math.floor(Date.now() / 1000), // Unix timestamp // 4 bytes little-endian
        bits, // place for proof of work // 4 bytes
        nonce // number that is changed by miners when minning (generate proof of work) // 4 bytes
    }) {
        this.version = version;
        this.prevBlock = prevBlock;
        this.merkleRoot = merkleRoot;
        this.timestamp = timestamp;
        this.bits = bits;
        this.nonce = nonce;
    }

    // 4 + 32 + 32 + 4 + 4 + 4 = 80 bytes
    serialize() {
        return Buffer.concat([
            uInt32LE(this.version),
            Buffer.from(this.prevBlock, "hex").reverse(),
            Buffer.from(this.merkleRoot, "hex").reverse(),
            uInt32LE(this.timestamp),
            uInt32LE(this.bits),
            uInt32LE(this.nonce)
        ])
    }

    static parse(buffer) {
        let offset = 0;
        const version = buffer.readUInt32LE(offset);
        offset += 4;

        const prevBlock = buffer.slice(offset, offset + 32).reverse().toString("hex");
        offset += 32;

        const merkleRoot = buffer.slice(offset, offset + 32).reverse().toString("hex");
        offset += 32;

        const timestamp = buffer.readUInt32LE(offset); 
        offset += 4;
        
        const bits = buffer.readUInt32LE(offset); 
        offset += 4;
        
        const nonce = buffer.readUInt32LE(offset);
        return new Block({ version, prevBlock, merkleRoot, timestamp, bits, nonce });
    }

    hash() {
        return sha256(sha256(this.serialize())).reverse().toString("hex");
    }
}