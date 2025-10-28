import WebSocket, { WebSocketServer } from 'ws';
import { Wallet } from '../wallet/wallet.js';

export class Node {
    constructor(port, peers = []) {
        this.port = port;
        this.peers = peers;
        this.sockets = [];
    }

    static MSG = {
        HELLO: "HELLO",
        WELCOME: "WELCOME",
        PING: "PING",
        PONG: "PONG",
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

    // Use this method to init Node
    async init() {
        this.createServer();
        await this.connectToPeers();
        console.log(`Node on port: ${this.port} is ready`);
    }

}

export default Node;