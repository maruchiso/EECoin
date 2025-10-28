import { P2PNode } from '../node/p2p.js'

const nodeA = new P2PNode(6001, ['ws://localhost:6002']);
const nodeB = new P2PNode(6002, ['ws://localhost:6001']);

async function runTest() {
    console.log('Start test');
    await nodeA.init();
    await new Promise((res) => setTimeout(res, 300));
    await nodeB.init();

    // Test broadcast
    setTimeout(() => {
        console.log('Node A sending PING by broadcast');
        nodeA.broadcast({ type: P2PNode.MSG.PING, from: nodeA.port })
    }, 1500);

    //Test send
    setTimeout(() => {
        console.log('Node A sending PING by send');
        nodeA.send(nodeA.sockets[0], { type: P2PNode.MSG.PING, from: nodeA.port })
    }, 1500);

}

runTest()