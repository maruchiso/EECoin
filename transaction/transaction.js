import { sha256 } from "../wallet/helpers.js";
import { uInt32LE } from "../block/helpers.js";

// 1. wersja, 2. wejścia, 3. wyjścia, 4. czas blokady 

export class TxIn {
    constructor(prevTx, prevIndex, signature = null, pubKey = null) {
        this.prevTx = prevTx,
        this.prevIndex = prevIndex,
        this.signature = signature, // w książce scriptSig
        this.pubKey = pubKey;       // tu też
    }
}

export class TxOut {
    constructor(amount, address) {
        this.amount = amount,
        this.address = address;     // w książce scriptPubKey
    }
}

export class Transaction {
    constructor({ version = 1, inputs = [], outputs = [], locktime = 0} = {}) {
        this.version = version,
        this.inputs = inputs,
        this.outputs = outputs,
        this.locktime = locktime;
    }

    serialize() {
        const parts = [];
        // version 4 bytes LE
        parts.push(uInt32LE(this.version));

        // inputs length
        parts.push(Buffer.from([this.inputs.length]));
        // inputs serialize
        for (const input of this.inputs) {
            // prevTx hash transakcji LE
            const prevTxBuf = Buffer.from(input.prevTx, "hex").reverse();
            parts.push(prevTxBuf);

            // prevIndex
            const indexValue = Number(input.prevIndex);
            parts.push(uInt32LE(indexValue));
            
            // signature
            if (input.signature) {
                const sigBuf = Buffer.from(input.signature, "hex");
                parts.push(Buffer.from([sigBuf.length]));
                parts.push(sigBuf);
            } else {
                parts.push(Buffer.from([0]));      // brak podpisu
            }

            // pubKey
            if (input.pubKey) {
                const pubBuf = Buffer.from(input.pubKey, "hex");
                parts.push(Buffer.from([pubBuf.length]));
                parts.push(pubBuf);
            } else {
                parts.push(Buffer.from([0]));      // brak klucza
            }
        }

        // outputs length
        parts.push(Buffer.from([this.outputs.length]))
        // outputs serialize
        for (const output of this.outputs) {
            const amountBuf = Buffer.alloc(8);
            amountBuf.writeBigUInt64LE(BigInt(output.amount));
            parts.push(amountBuf);

            const addrBuf = Buffer.from(output.address, "utf8");
            parts.push(Buffer.from([addrBuf.length]));
            parts.push(addrBuf);
        }
        
        // locktime 4 bytes LE
        parts.push(uInt32LE(this.locktime));

        return Buffer.concat(parts);
    }

    hash() {
        return sha256(sha256(this.serialize()));
    }

    id() {
        return this.hash().toString("hex");
    }


}
