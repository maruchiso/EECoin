import { Blockchain } from "../block/blockchain.js";
import Node from "../node/p2p.js";

async function test() {

    const chainA = new Blockchain();
    const chainB = new Blockchain();
    const chainC = new Blockchain();

    const nodeA = new Node(6001, ["ws://localhost:6002", "ws://localhost:6003"], chainA);
    const nodeB = new Node(6002, ["ws://localhost:6001", "ws://localhost:6003"], chainB);
    const nodeC = new Node(6003, ["ws://localhost:6001", "ws://localhost:6002"], chainC);

    await nodeA.init();
    await new Promise(r => setTimeout(r, 300));
    await nodeB.init();
    await new Promise(r => setTimeout(r, 300));
    await nodeC.init();
    await new Promise(r => setTimeout(r, 500));

    console.log("nodeA is mining a new block");
    const merkle = "11".repeat(32);
    const block = chainA.mineNextBlock(merkle);
    console.log("nodeA mined: ", block.hash());

    nodeA.broadcastBlock(block);

    await new Promise(r => setTimeout(r, 3000));

    console.log("nodeA lenght: ", chainA.chain.length);
    console.log("nodeB lenght: ", chainB.chain.length);
    console.log("nodeC lenght: ", chainC.chain.length);
}

test();
