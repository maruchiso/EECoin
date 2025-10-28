import { Wallet } from "../wallet/wallet.js";
import { compressedPublicKeyFromKeyPair, publicKeyToAddress, privateKeyToWIF } from "../wallet/helpers.js"

const wallet1 = new Wallet();
const wallet2 = new Wallet();

console.log('Wallet1 private key: ', wallet1.getPrivateKey());
console.log('Wallet1 public key: ', wallet1.publicKey);
console.log('Wallet1 private key: ', wallet2.getPrivateKey());
console.log('Wallet1 public key: ', wallet2.publicKey);

// wallet1 sign message
const message = "Test message";
const signature = wallet1.signMessage(message);
console.log("wallet1 signature to message: ", signature)

// Test verify by correct public key
var verifyWallet1 = Wallet.verifySignature(message, signature, wallet1.publicKey)
console.log("Should be true", verifyWallet1)

// Test verify by incorrect public key (from wallet2)
var verifyWallet2 = Wallet.verifySignature(message, signature, wallet2.publicKey)
console.log("Should be false", verifyWallet2)

// Test compress Public key from Key Pair
const keyPair = wallet1.getKeyPair();
const compressedPublicKey = compressedPublicKeyFromKeyPair(keyPair);
console.log("Compressed public key for wallet1", compressedPublicKey)

// Test adress from Public key for mainnet
const address = publicKeyToAddress(compressedPublicKey, 'mainnet');
console.log("Address for wallet1 from public key: ", address);

// Test WIF for mainnet
const privateKey = wallet1.getPrivateKey();
const wif = privateKeyToWIF(privateKey, 'mainnet');
console.log("WIF: ", wif)
