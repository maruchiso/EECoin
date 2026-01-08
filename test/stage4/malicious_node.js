import Node from "../../node/p2p.js";
import { Blockchain } from "../../block/blockchain.js";
import { Wallet } from "../../wallet/wallet.js";

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function test() {
    const chains = [
    new Blockchain(),
    new Blockchain(),
    new Blockchain()
    ];

    const wallets = [
    new Wallet(),
    new Wallet(),
    new Wallet()
    ];


    // Node 0 = malicious (kopie prawie cały czas)
    // Node 1,2 = ok

    const nodes = [
    new Node(6001, ["ws://localhost:6002", "ws://localhost:6003"], chains[0], wallets[0]),
    new Node(6002, ["ws://localhost:6001", "ws://localhost:6003"], chains[1], wallets[1]),
    new Node(6003, ["ws://localhost:6001", "ws://localhost:6002"], chains[2], wallets[2]),
    ];

    for (const n of nodes) await n.init();
    await sleep(500);


    // nody 1 i 2 kopią krótko

    nodes[1].startMining(wallets[1].address);
    nodes[2].startMining(wallets[2].address);

    await sleep(3000);

    nodes[1].stopMining();
    nodes[2].stopMining();


    // Node 0 kopie długo

    nodes[0].startMining(wallets[0].address);
    await sleep(7000);
    nodes[0].stopMining();

    // Stabilizacja
    await sleep(4000);

    console.log("Heights:", chains.map(c => c.getHeight()));
    console.log("Tips:", chains.map(c => c.tip));


    process.exit(0);
}

test();
