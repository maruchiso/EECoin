import { Blockchain } from "../block/blockchain.js";
import { Transaction } from "../transaction/transaction.js";
import { Wallet } from "../wallet/wallet.js";

function logBalances(chain, wallets) {
    console.log("Balances");
    for (const w of wallets) {
        console.log(`${w.address}:`, chain.getBalance(w.address));
    }
}

async function test() {
    const chain = new Blockchain({ blockReward: 50 });
    const miner = new Wallet();
    const alice = new Wallet();
    const bob = new Wallet();
    const charlie = new Wallet();

    console.log("1. Mine coinbase");
    chain.mineNextBlock(miner.address);
    logBalances(chain, [miner, alice, bob, charlie]);

    // Miner wydaje UTXO z coinbase (50) tworzy jedną transakcje z 2 outputami
    console.log("2. Miner sends 30 EECoins to Alice");
    const tx1 = new Transaction({
        inputs: [{
            prevTx: chain.chain[1].transactions[0].id(),
            prevIndex: 0,
            signature: null,
            pubKey: null,
        }],
        outputs: [
            { amount: 30, address: alice.address },
            { amount: 20, address: miner.address },
        ],
    });

    // Miner kopie blok (20+50)
    chain.mineNextBlock(miner.address, [tx1]);
    logBalances(chain, [miner, alice, bob, charlie]);
    
    console.log("3. Alice sends 10 EECoins to Bob");
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
    logBalances(chain, [miner, alice, bob, charlie]);

    console.log("4. Miner distributes funds in one transaction (multi-output)");
    const tx3 = new Transaction({
        inputs: [{
            prevTx: tx1.id(),
            prevIndex: 1,       // output[1] = 20 -> miner
            signature: null,
            pubKey: null,
        }],
        outputs: [
            { amount: 5, address: alice.address },
            { amount: 5, address: bob.address },
            { amount: 5, address: charlie.address },
            { amount: 5, address: miner.address },
        ],
    });

    chain.mineNextBlock(miner.address, [tx3]);
    logBalances(chain, [miner, alice, bob, charlie]);

    console.log("5. Double-spending attempt");

    const badTx = new Transaction({
        inputs: [{
            prevTx: tx1.id(),      // to samo UTXO co wcześniej
            prevIndex: 0,
            signature: null,
            pubKey: null,
        }],
        outputs: [
            { amount: 5, address: bob.address },
        ],
    });

    chain.mineNextBlock(miner.address, [badTx]);
}

test();
