import { Wallet } from "../wallet/wallet.js";

const password = 'admin123';
const wallet = new Wallet({network: 'mainnet'});
console.log('New wallet: ', wallet.getInfo());

// Save to file
wallet.saveToKeystore(password, './wallet/keystore.json');

// lock wallet
wallet.lockWallet();
console.log('Locked wallet: ', wallet.getInfo());

// get from file
const wallet2 = Wallet.createWalletFromKeystore(password, './wallet/keystore.json');
console.log('Wallet from file', wallet2.getInfo());

// Sign and verify
const message = "Test message";
const signature = wallet2.signMessage(message);
const verifyWallet2 = Wallet.verifySignature(message, signature, wallet2.publicKey);
console.log('Verify signature', verifyWallet2);