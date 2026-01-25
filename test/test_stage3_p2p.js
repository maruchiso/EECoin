import { Blockchain } from "../block/blockchain.js";
import { Transaction } from "../transaction/transaction.js";
import { Wallet } from "../wallet/wallet.js";
import { logBalances } from "./test_stage3_local.js";

const miner = new Wallet();
const alice = new Wallet();
const bob = new Wallet();

const chain = new Blockchain({ blockReward: 50 });


console.log("[1] Mine first block (coinbase only)");
chain.mineNextBlock(miner.address);
logBalances(chain, [miner, alice, bob]);

/*
UTXO:
- coinbaseTx:0 -> miner (50)
*/
// Miner -> Alice (30)


console.log("\n[2] Miner sends 30 to Alice");

const coinbaseTxId = chain.chain[1].transactions[0].id();

const tx1 = new Transaction({
    inputs: [{
        prevTx: coinbaseTxId,
        prevIndex: 0,
        signature: null,
        pubKey: null,
    }],
    outputs: [
        { amount: 30, address: alice.address },
        { amount: 20, address: miner.address },
    ],
});

// test serialize and parse
const raw = tx1.serialize();
const parsedTx = Transaction.parse(raw);

if (tx1.id() !== parsedTx.id()) {
    throw new Error("TX serialize/parse mismatch!");
}
console.log("TX serialize/parse OK");

chain.mineNextBlock(miner.address, [tx1]);
logBalances(chain, [miner, alice, bob]);

/*
UTXO:
- tx1:0 -> Alice (30)
- tx1:1 -> Miner (20)
- new coinbase -> Miner (50)
*/
// Alice -> Bob (10)
console.log("\n[3] Alice sends 10 to Bob");

const tx2 = new Transaction({
    inputs: [{
        prevTx: tx1.id(),
        prevIndex: 0,
        signature: null,
        pubKey: null,
    }],
    outputs: [
        { amount: 10, address: bob.address },
        { amount: 20, address: alice.address },
    ],
});

chain.mineNextBlock(miner.address, [tx2]);
logBalances(chain, [miner, alice, bob]);

/*
UTXO:
- tx2:0 -> Bob (10)
- tx2:1 -> Alice (20)
- tx1:1 -> Miner (20)
- coinbase x2 -> Miner (100)
*/
// Double spending attempt

console.log("\n[4] Double-spending attempt (should FAIL)");

const badTx = new Transaction({
    inputs: [{
        prevTx: tx1.id(), // already spent in tx2
        prevIndex: 0,
        signature: null,
        pubKey: null,
    }],
    outputs: [
        { amount: 5, address: bob.address },
    ],
});
chain.mineNextBlock(miner.address, [badTx]);

