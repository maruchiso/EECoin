import pkg from 'elliptic';
import crypto from 'crypto';

const {ec: EC} = pkg;
const ec = new EC('secp256k1');

export class Wallet {
    constructor() {
        // ECDSA - privateKey * G = publicKey
        this.keyPair = ec.genKeyPair();
        this.publicKey = this.keyPair.getPublic('hex');
        this.privateKey = this.keyPair.getPrivate('hex');
    }
    
    signMessage(message) {
        // Calculate hash for message
        const hash = Wallet.hashMessage(message);
        // Sign 
        const signature = this.keyPair.sign(hash);
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