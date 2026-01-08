import Node from "../../node/p2p.js";
import { Blockchain } from "../../block/blockchain.js";
import { Wallet } from "../../wallet/wallet.js";

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function test() {
  const chainA = new Blockchain();
  const chainB = new Blockchain();

  const walletA = new Wallet();
  const walletB = new Wallet();

  // A i B połączone ze sobą
  const nodeA = new Node(6001, ["ws://localhost:6002"], chainA, walletA);
  const nodeB = new Node(6002, ["ws://localhost:6001"], chainB, walletB);

  await nodeA.init();
  await sleep(300);
  await nodeB.init();

  nodeA.startMining(walletA.address);
  nodeB.startMining(walletB.address);

  await sleep(6000);
  nodeA.stopMining();
  nodeB.stopMining();

  // wznawiamy kopanie dla node A
  nodeA.startMining(walletA.address);
  await sleep(3000);
  nodeA.stopMining();

  // czas na propagację i reorg
  await sleep(2000);

  console.log("Heights:", chainA.getHeight(), chainB.getHeight());
  console.log("Tips:", chainA.tip, chainB.tip);

  process.exit(0);
}

test();
// oczekiwany rezultat to takie same wysokości oraz tip