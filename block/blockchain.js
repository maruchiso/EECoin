import { Block } from "./block.js";
import { merkleRoot } from "./merkle.js";
import { Transaction } from "../transaction/transaction.js";
import { Wallet } from "../wallet/wallet.js";
import { createCoinbaseTx, isCoinbaseInput } from "../transaction/coinbase.js";

export class Blockchain {
    constructor({ bits = 0x1effffff, blockReward = 3 } = {}) {
        this.bits = bits;
        // this.chain = [];
        this.blocksByHash = new Map();  // graf bloków
        this.heightByHash = new Map();  // każdy blok zna swoją wyokość
        this.tip = null;    // hash czubka
        this.orphans = new Map();   // przechowuje bloki które przyszły za wcześnie
        this.createFirstBlock();
        this.blockReward = blockReward;
    }

    createFirstBlock() {
        const block = new Block ({
            version: 1,
            prevBlock: "00".repeat(32),
            merkleRoot: "00".repeat(32),
            timestamp: 1700000000,
            bits: this.bits, // na sztywno ustawić
            nonce: 0,
            transactions: [],
        })

        block.mine();
        // this.chain.push(block);
        const hash = block.hash();
        this.blocksByHash.set(hash, block);
        this.heightByHash.set(hash, 0);
        this.tip = hash;
    }

    // getLastBlock() {
    //     const lastBlockIndex = this.chain.length - 1;
    //     return this.chain[lastBlockIndex];
    // }
    getTipBlock() {
        return this.blocksByHash.get(this.tip);
    }

    getActiveChain() {
        const chain = [];
        let tip = this.tip;
        while (tip) {
            const block = this.blocksByHash.get(tip);
            chain.push(block);
            if (block.prevBlock === "00".repeat(32)) tip = null;
            else tip = block.prevBlock;
        }

        return chain.reverse();
    }

    // Budujemy UTXO na podstawie całego łańcucha (Unspent transaction Output)
    getUTXO() {
        const utxo = new Map();
        for (const block of this.getActiveChain()) {
            if (block.transactions.length === 0) continue;

            for (const tx of block.transactions) {
                const txId = tx.id();
                // ustawiamy wszystkie outputs jako UTXO
                tx.outputs.forEach((out, idx) => {
                    utxo.set(`${txId}:${idx}`, out);
                })

                // uswamy UTXO, które zostały wydane jako inputy
                for (const input of tx.inputs) {
                    if (isCoinbaseInput(input)) continue;
                    utxo.delete(`${input.prevTx}:${input.prevIndex}`);
                }

            }
        }

        return utxo;
    }

    getBalance(address) {
        const utxo = this.getUTXO();
        let sum = 0;
        for (const out of utxo.values()) {
            if (out.address === address) {
                sum += out.amount;
            }
        }
        return sum;
    }

    validateTransaction(tx) {
        // coinbase przepuszczamy od razu
        if (tx.inputs.length === 1 && isCoinbaseInput(tx.inputs[0])) return true;
        const utxo = this.getUTXO();
        let inputSum = 0;
        let outputSum = 0;

        for (const out of tx.outputs) {
            outputSum += out.amount;
        }

        // najpierw validacja czy inputy wskazują na istniejące UTXO
        for (const input of tx.inputs) {
            if (isCoinbaseInput(input)) continue;
            const key = `${input.prevTx}:${input.prevIndex}`;
            const checkIfUTXO = utxo.get(key);
            if (!checkIfUTXO) {
                console.error("Double-spend or doesn't exist UTXO for key: ", key);
                return false;
            }

            inputSum += checkIfUTXO.amount;

            // // weryfikacja podpisu, podpisywane jest id transakcji
            // const msg = tx.id();
            // const verifySignatureWallet = Wallet.verifySignature(msg, input.signature, input.pubKey);
            // if (!verifySignatureWallet) {
            //     console.error("Invalid signature!");
            //     return false;
            // }
        }

        if (inputSum < outputSum) {
            console.error("Input sum < Output sum");
            return false;
        }

        return true;
    }

    validateBlock(block) {
        if (!this.blocksByHash.has(block.prevBlock)) {
            console.error("Previous block is not match.");
            return false;
        }

        if (!block.checkPoW()) {
            console.error("Invalid PoW");
            return false;
        }

        return true;
    }

    // dodanie sprawdzanie transakcji, coinbase, merkleroot
    addBlock(block) {
        const hash = block.hash();
        const prev = block.prevBlock;

        // orphan
        if (!this.blocksByHash.has(prev)) {
            if (!this.orphans.has(prev)) {
                this.orphans.set(prev, []);
            }
            this.orphans.get(prev).push(block);
            console.log("Orphan block received (hash: ", hash, ")");
            return false;
        }

        if (!this.validateBlock(block)) {
            return false;
        }
        if (block.transactions && block.transactions.length > 0) {
            const coinbase = block.transactions[0];
            if (!(coinbase.inputs.length === 1 && isCoinbaseInput(coinbase.inputs[0]))) {
                console.error("First transaction is not coinbase")
                return false;
            }
            // sprawdzenie wiele coinbasów
            for (let i = 1; i < block.transactions.length; i++) {
                if (block.transactions[i].inputs.some(isCoinbaseInput)) {
                    console.error("Multiple coinbase transactions detected");
                    return false;
                }
            }
            // sprawdzenie rewarda
            let reward = 0;
            for (const out of coinbase.outputs) {
                if (out.amount <= 0) {
                    console.error("Invalid coinbase output amount");
                    return false;
                }
                reward += out.amount;
            }

            if (reward > this.blockReward) {
                console.error("Coinbase reward too high");
                return false;
            }

            for (let i = 1; i < block.transactions.length; i++) {
                if (!this.validateTransaction(block.transactions[i])) {
                    console.error("Invalid transaction in block")
                    return false;
                }
            }

            const merkle = merkleRoot(block.transactions);
            if (merkle !== block.merkleRoot) {
                console.error("Merkle root is not okay");
                return false;
            }
        }
        // save block
        const height = this.heightByHash.get(prev) + 1;
        this.blocksByHash.set(hash, block);
        this.heightByHash.set(hash, height);

        // the best tip = the longest chain 
        if (height > this.heightByHash.get(this.tip)) {
            this.tip = hash;
            console.log("New tip selected (hash: ", hash, ", height: ", height, ")");
        }
        
        // try to unlock orphans
        if (this.orphans.has(hash)) {
            for (const orphan of this.orphans.get(hash)) {
                // rekurencja
                this.addBlock(orphan);
            }
            this.orphans.delete(hash);
        }

        console.log("Block has been added!")
        return true;

    }

    mineNextBlock(minerAddress, transactions=[]) {
        const parent = this.getTipBlock();
        const coinbaseTx = createCoinbaseTx(minerAddress, this.blockReward);
        const txs = [coinbaseTx];
        for (const tx of transactions) {
            txs.push(tx);
        }
        const merkle = merkleRoot(txs)
        const newBlock = new Block ({
            version: 1,
            prevBlock: parent.hash(),
            merkleRoot: merkle,
            timestamp: Math.floor(Date.now() / 1000),
            bits: this.bits,
            nonce: 0,
            transactions: txs,
        });

        newBlock.mine();
        this.addBlock(newBlock);

        return newBlock;
    }
    
    createCandidateBlock(minerAddress, mempool = []) {
        const last = this.getTipBlock();
        const coinbase = createCoinbaseTx(minerAddress, this.blockReward);
        const txs = [coinbase, ...mempool];
        const merkle = merkleRoot(txs);

        return new Block({
            version: 1,
            prevBlock: last.hash(),
            merkleRoot: merkle,
            timestamp: Math.floor(Date.now() / 1000),
            bits: this.bits,
            nonce: 0,
            transactions: txs,
        });
    }

    getHeight() {
        return this.heightByHash.get(this.tip);
    }

    getTipBlock() {
        return this.blocksByHash.get(this.tip);
    }

}