import { Block } from "./block.js";

export class Blockchain {
    constructor({ bits = 0x1effffff} = {}) {
        this.bits = bits;
        this.chain = [];
        this.createFirstBlock();
    }

    createFirstBlock() {
        const block = new Block ({
            version: 1,
            prevBlock: "00".repeat(32),
            merkleRoot: "00".repeat(32),
            timestamp: 1700000000,
            bits: this.bits,
            nonce: 0,
        })

        block.mine();
        this.chain.push(block);
    }

    getLastBlock() {
        const lastBlockIndex = this.chain.length - 1;
        return this.chain[lastBlockIndex];
    }

    validateBlock(block) {
        const lastBlock = this.getLastBlock();
        if (block.prevBlock !== lastBlock.hash()) {
            console.error("Previous block is not match.");
            return false;
        }

        if (!block.checkPoW()) {
            console.error("Invalid PoW");
            return false;
        }

        return true;
    }

    addBlock(block) {
        if (!this.validateBlock(block)) {
            return false;
        }
        else {
            this.chain.push(block);
            console.log("Block has been added!");
            return true;
        }
    }

    mineNextBlock(merkleRoot) {
        const lastBlock = this.getLastBlock();

        const newBlock = new Block ({
            version: 1,
            prevBlock: lastBlock.hash(),
            merkleRoot: merkleRoot,
            timestamp: Math.floor(Date.now() / 1000),
            bits: this.bits,
            nonce: 0,
        });

        newBlock.mine();
        this.addBlock(newBlock);

        return newBlock;
    }
}