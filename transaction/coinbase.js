import { Transaction, TxIn, TxOut } from "./transaction.js";

export function createCoinbaseTx(minerAddress, reward = 3) {
    const input = new TxIn("00".repeat(32), 0xffffffff, null, null);
    const output = new TxOut(reward, minerAddress);

    return new Transaction({
        version: 1,
        inputs: [input],
        outputs: [output],
        locktime: 0,
    });
}

export function isCoinbaseInput(txIn) {
    return (
        txIn.prevTx === "00".repeat(32) && txIn.prevIndex === 0xffffffff
    );
}