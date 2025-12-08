import { Block } from "../block/block.js";

const block = new Block({
    prevBlock: "00".repeat(32),
    merkleRoot: "11".repeat(32),
    bits: 0x1effffff,
    nonce: 0
});

block.mine();
console.log("hash:", block.hash());
console.log("nonce:", block.nonce);
console.log("pow valid:", block.checkPoW());
