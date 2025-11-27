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

    // PoW
    // Górnicy po sprawdzeniu wszystkich możliwości z pola nonce
    // skrót każdego nagłówka bloku interpretowany jako liczba ma mieć wartość niższą od wskazanego celu (target - 256 bits, target = coefficeint * 256 ^ (exponent - 3))
    bitsToTarget() {
        // bits convert to 4 bytes LE
        const buf = uInt32LE(this.bits);
        // last byte -> exponent
        const exponent = buf[3];

        // 3 first bytes -> coefficient
        const coefficeint = buf.readUIntLE(0, 3);

        // coefficeint * 256 ^ (exponent - 3)
        return BigInt(coefficeint) * (1n << (8n * BigInt(exponent - 3)))
    }

    checkPoW() {
        const target = this.bitsToTarget();
        const hashInt = BigInt("0x" + this.hash());
        return hashInt < target;
    }

    // Kopanie polega na na przeszukiwaniu nonce w celu znalezenia hasha, który jest mniejszy od celu
    mine() {
        while (true) {
            if (this.checkPoW()) {
                return this;
            }
            this.nonce++;

        }
    }

}