import { P2PNode } from '../node/p2p.js'

const nodeA = new P2PNode(6001, ['ws://localhost:6002']);
const nodeB = new P2PNode(6002, ['ws://localhost:6001', 'ws://localhost:6003']);
const nodeC = new P2PNode(6003, ['ws://localhost:6002']);

async function runTest() {
    console.log('Start test');
    await nodeA.init();
    await new Promise((res) => setTimeout(res, 300));
    await nodeB.init();
    await new Promise((res) => setTimeout(res, 300));
    await nodeC.init();

    await new Promise(res => setTimeout(res, 1000));
    // Test broadcast from Node A
    setTimeout(() => {
        console.log('Node A sending PING by broadcast');
        nodeA.broadcast({ type: P2PNode.MSG.PING, from: nodeA.port })
    }, 1500);

    // Test broadcast from Node B
    setTimeout(() => {
        console.log('Node B sending PING by broadcast');
        nodeB.broadcast({ type: P2PNode.MSG.PING, from: nodeB.port })
    }, 3500);

    //Test send
    setTimeout(() => {
        console.log('Node A sending PING by send');
        nodeA.send(nodeA.sockets[0], { type: P2PNode.MSG.PING, from: nodeA.port })
    }, 5500);

        setTimeout(() => {
        console.log('Test completed');
        process.exit(0);
    }, 8000);

}

runTest()