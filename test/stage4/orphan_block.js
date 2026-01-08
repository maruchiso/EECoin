import { Blockchain } from "../../block/blockchain.js";
import { Wallet } from "../../wallet/wallet.js";

async function test() {
    console.log("=== ORPHAN BLOCK TEST ===");

    const miner = new Wallet();

    // uczciwy górnik
    const chainA = new Blockchain();

    // węzeł, który dostanie bloki w złej kolejności
    const chainB = new Blockchain();

    // Chain A kopie parenta
    const parent = chainA.mineNextBlock(miner.address);
    chainA.addBlock(parent);

    // Chain A kopie childa
    const child = chainA.mineNextBlock(miner.address);
    chainA.addBlock(child);
    console.log("Chain A height:", chainA.getHeight()); // 2

    // Chain B dostaje NAJPIERW childa (bez parenta)
    console.log("Adding orphan block (child first)...");
    const ok1 = chainB.addBlock(child);

    console.log("Accepted child?", ok1); // false
    console.log("Orphans stored:", chainB.orphans.size); // 1

    // Chain B dostaje parenta
    console.log("Adding missing parent...");
    const ok2 = chainB.addBlock(parent);

    console.log("Accepted parent?", ok2); // true

    // Orphan powinien się podpiąć
    console.log("Final height:", chainB.getHeight()); // 2
    console.log("Final tip:", chainB.tip);

    process.exit(0);
}

test();
