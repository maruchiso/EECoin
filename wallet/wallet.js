import pkg from 'elliptic';
import crypto from 'crypto';
import { compressedPublicKeyFromKeyPair, publicKeyToAddress, privateKeyToWIF } from "../wallet/helpers.js"
import { encryptPrivateKey, decryptPrivateKey, saveKeystore, loadKeystore } from "../wallet/keystore.js"

const {ec: EC} = pkg;
const ec = new EC('secp256k1');

export class Wallet {
    constructor({ network = 'testnet' } = {}) {
        this.network = network;
        // ECDSA - privateKey * G = publicKey
        this._keyPair = ec.genKeyPair();
        this._privateKey = this._keyPair.getPrivate('hex');
        this.publicKey = compressedPublicKeyFromKeyPair(this._keyPair);
        this.address = publicKeyToAddress(this.publicKey, this.network);
        this.wif = privateKeyToWIF(this._privateKey, this.network);
        this._locekd = false;
    }

    // Create wallet from keystore file
    static createWalletFromKeystore(password, filePath, { network = 'testnet' } = {}) {
        const keystore = loadKeystore(filePath);
        const privateKey = decryptPrivateKey(keystore, password);
        if (!privateKey) {
            console.warn('Cannot decrypt private key');
            return null;
        }
        else {
        const wallet = Object.create(Wallet.prototype);
        wallet.network = network;
        wallet._privateKey = privateKey;
        wallet._keyPair = ec.keyFromPrivate(privateKey);
        wallet.publicKey = compressedPublicKeyFromKeyPair(wallet._keyPair);
        wallet.address = publicKeyToAddress(wallet.publicKey, wallet.network);
        wallet.wif = privateKeyToWIF(privateKey, wallet.network);
        wallet._locekd = false;
        return wallet;
        }
    }

    // Save private key to cypher keystore
    saveToKeystore(password, filePath = './wallet/keystore.json') {
        const keystore = encryptPrivateKey(this._privateKey, password);
        saveKeystore(filePath, keystore);
        console.log(`Keystore is saved here: ${filePath}`);
    }

    // Delete key
    lockWallet() {
        this._privateKey = null;
        this._keyPair = null;
        this._locekd = true;
    }

    // Unlock existing wallet
    unlockFromKeystore(password, filePath='./wallet/keystore.json') {
        const keystore = loadKeystore(filePath);
        const privateKey = decryptPrivateKey(keystore, password);
        if (!privateKey) {
            console.warn('Cannot decrypt private key');
            return null;
        }
        else {
        this._keyPair = ec.keyFromPrivate(privateKey);
        this._privateKey = privateKey;
        this.publicKey = compressedPublicKeyFromKeyPair(this._keyPair);
        this.address = publicKeyToAddress(this.publicKey, this.network);
        this.wif = privateKeyToWIF(privateKey, this.network);
        this._locked = false;
        }
    }

    // only to debug
    getPrivateKey() {
        return this._privateKey;
    }
    // only to debug
    getKeyPair() {
        return this._keyPair;
    }

    signMessage(message) {
        // Check if wallet is unlocked
        if (this._locked) {
            throw new Error('Wallet is locked');
        }
        // Calculate hash for message
        const hash = Wallet.hashMessage(message);
        // Sign 
        const signature = this._keyPair.sign(hash);
        return signature.toDER('hex');
    }

    static hashMessage(message) { 
        return crypto.createHash('sha256').update(message).digest('hex');
    }

    static verifySignature(message, signatureHex, publicKeyHex) {
        const key = ec.keyFromPublic(publicKeyHex, 'hex');
        const hash = Wallet.hashMessage(message);
        return key.verify(hash, signatureHex);
    }
    
    // only to debug
    getInfo() {
        return {
            network: this.network,
            publicKey: this.publicKey,
            privateKey: this.getPrivateKey()
        }
    }
}