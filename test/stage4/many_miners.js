import Node from "../../node/p2p.js";
import { Blockchain } from "../../block/blockchain.js";
import { Wallet } from "../../wallet/wallet.js";

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function test() {
    const chains = [];
    const wallets = [];
    const nodes = [];

    const ports = [6001, 6002, 6003, 6004];

    for (let i = 0; i < ports.length; i++) {
        chains.push(new Blockchain());
        wallets.push(new Wallet());
    }

    for (let i = 0; i < ports.length; i++) {
        const peers = ports.filter(p => p !== ports[i]).map(p => `ws://localhost:${p}`);

        nodes.push(new Node(ports[i], peers, chains[i], wallets[i]));
    }

    for (const n of nodes) await n.init();
    await sleep(500);

    // Wszyscy startują równocześnie
    nodes.forEach((n, i) => n.startMining(wallets[i].address));

    await sleep(8000);

    nodes.forEach(n => n.stopMining());

    // Stabilizacja
    await sleep(4000);

    console.log("Heights:", chains.map(c => c.getHeight()));
    console.log("Tips:", chains.map(c => c.tip));

    //Oczekujemy:
    //heights bardzo zbliżone
    //tipy w końcu identyczne (lub 1 fork na równym height)
    process.exit(0);
}

test();
