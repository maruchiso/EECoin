import WebSocket, { WebSocketServer } from 'ws';
import { Wallet } from '../wallet/wallet.js';
import { Block } from '../block/block.js';
import { Transaction } from '../transaction/transaction.js';

export class Node {
    constructor(port, peers = [], blockchain) {
        this.port = port;
        this.peers = peers;
        this.sockets = [];
        this.blockchain = blockchain;
        this.mempool = [];
    }

    static MSG = {
        HELLO: "HELLO",
        WELCOME: "WELCOME",
        PING: "PING",
        PONG: "PONG",
        BLOCK: "BLOCK",
        TX: "TX",
    };

    createServer() {
        this.server = new WebSocketServer({ port: this.port });
        this.server.on('connection', (ws) => this.initSocket(ws));
        console.log(`Node is listening on port: ${this.port}`);
    }

    initSocket(ws) {
        this.sockets.push(ws);
        ws.on('message', (data) => this.handleMessage(ws, data));
        ws.on('close', () => {
            this.sockets = this.sockets.filter(s => s != ws);
            console.log(`Disconnect peer from port: ${this.port}`);
        });
        this.send(ws, { type: Node.MSG.HELLO, from: this.port });
    }

    connectToPeer(address) {
        return new Promise((resolve) => {
            const ws = new WebSocket(address);
            ws.on('open', () => {
                console.log(`Connect with ${address}`)
                this.initSocket(ws);
                resolve();
            });
            ws.on('error', (err) => {
                console.warn(`Connection Error with ${address}: ${err.message}`)
                resolve();
            });
        });
    }

    async connectToPeers() {
        for (const peer of this.peers) {
            await this.connectToPeer(peer);
        }
    }

    broadcastBlock(block) {
        const serializedBlock = block.serialize().toString("hex");
        const msg = {
            type: Node.MSG.BLOCK,
            block: serializedBlock
        };
        this.broadcast(msg);
        console.log("Broadcast Block to peers");
    }

    broadcastTx(tx) {
        const msg = {
            type: Node.MSG.TX,
            tx: tx.serialize().toString(),
        };
        this.broadcast(msg);
        console.log("Broadcast transaction to peers")
    }

    handleMessage(ws, data) {
        try {
            const msg = JSON.parse(data);
            console.log(`Message from ${this.port}: `, msg);

            switch (msg.type) {
                // After recive HELLO, Node is sending back WELCOME
                case Node.MSG.HELLO:
                    this.send(ws, { type: Node.MSG.WELCOME, from: this.port });
                    break;
                
                case Node.MSG.WELCOME:
                    console.log(`Welcome from ${msg.from}`);
                    break;

                // After recive PING, Node is sending back PONG
                case Node.MSG.PING:
                    console.log(`Ping from ${msg.from}, sending PONG`);
                    this.send(ws, { type: Node.MSG.PONG, from: this.port});
                    break;
                
                case Node.MSG.PONG:
                    console.log(`PONG from ${msg.from}`);
                    break;
                
                // type: BLOCK, block: serialized block (hex)
                case Node.MSG.BLOCK:
                    console.log(`Received new Block`);
                    const buf = Buffer.from(msg.block, "hex");
                    const block = Block.parse(buf);
                    if (this.blockchain.addBlock(block)) {
                        console.log("Block is accepted!");
                        // delete transactions from mempool
                        const ids = new Set(block.transactions.map((t) => t.id()));
                        this.mempool = this.mempool.filter((t) => !ids.has(t.id()));
                        console.log("Mempool cleaned")
                        this.broadcastNotToSender(msg);
                    }
                    else {
                        console.log("Block is not accepted!")
                    }
                    break;
                               
                case Node.MSG.TX: {
                    console.log("Received tranaction");
                    // parse tx
                    const buf = Buffer.from(msg.tx, "hex");
                    const tx = Transaction.parse(buf);
                    const ok = this.blockchain.validateTransaction(tx);
                    if (!ok) {
                        console.log("Transaction rejected");
                        break;
                    }

                    //Handle duplication
                    const id = tx.id();
                    const already = this.mempool.find((t) => t.id() === id);
                    if (already) break;

                    // Add to mempool
                    this.mempool.push(tx);
                    console.log("Transaction accepted into mempool")
                    this.broadcastNotToSender(ws, msg);
                    break;
                }
                default:
                    console.warn(`Unknown message type: ${msg.type}`);
            }
        } catch (err) {
            console.error(`Error parsing message: ${err.message}`)
        }
    }

    send(ws, msg) {
        ws.send(JSON.stringify(msg));
    }

    broadcast(msg) {
        this.sockets.forEach((ws) => this.send(ws, msg));
    }

    broadcastNotToSender(notThisWs, msg) {
        this.sockets.forEach((s) => {
            if (s !== notThisWs) this.send(s, msg);
        });
    }

    minerFromMempool(minerAddress) {
        if (this.mempool.length === 0) {
            console.log("Mempool empty");
            return null;
        }
        const txs = this.mempool;
        const block = this.blockchain.mineNextBlock(minerAddress, txs);
        if (block) {
            const includedIds = new Set(block.transactions.map((t) => t.id()));
            this.mempool = this.mempool.filter((t) => !includedIds.has(t.id()));
            this.broadcastBlock(block);
            console.log("Mined block and broadcasted. mempool size:", this.mempool.length);
            return block;
        }
        return null;
    }

    // Use this method to init Node
    async init() {
        this.createServer();
        await this.connectToPeers();
        console.log(`Node on port: ${this.port} is ready`);
    }

}

export default Node;