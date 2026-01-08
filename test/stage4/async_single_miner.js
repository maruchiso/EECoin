import { Blockchain } from "../../block/blockchain.js";
import { Wallet } from "../../wallet/wallet.js";
import Node from "../../node/p2p.js";

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function test() {
    const chain = new Blockchain();
    const wallet = new Wallet();
    const node = new Node(6001, [], chain, wallet);

    await node.init();
    node.startMining(wallet.address);
    await sleep(5000);
    node.stopMining();

    console.log("Height:", chain.getHeight());
    console.log("Tip:", chain.tip);
    console.log("Balance:", chain.getBalance(wallet.address));

    process.exit(0);
}

test();
// program powinien normalnie wypisywać logi
// mining robi kawałki pracy i oddaje sterowanie przez setImmediate()
