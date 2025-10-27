import pkg from 'elliptic';
import crypto from 'crypto';

const {ec: EC} = pkg;
const ec = new EC('secp256k1');

export class Wallet {
    constructor() {
        // ECDSA - privateKey * G = publicKey
        this._keyPair = ec.genKeyPair();
        this.publicKey = this._keyPair.getPublic('hex');
        this._privateKey = this._keyPair.getPrivate('hex');
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

}