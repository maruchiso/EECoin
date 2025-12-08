import { Blockchain } from "../block/blockchain.js";

const blockchain = new Blockchain();
console.log(blockchain.getLastBlock().hash());
const block = blockchain.mineNextBlock("11".repeat(32));
console.log(block.hash());
console.log(blockchain.chain.length)