import { Wallet } from "../wallet/wallet.js";

const password = 'admin123';
const wallet = new Wallet({network: 'mainnet'});
console.log('New wallet: ', wallet.getInfo());

// Save to file
wallet.saveToKeystore(password, './wallet/keystore.json');

// lock wallet
wallet.lockWallet();
console.log('Locked wallet: ', wallet.getInfo());

// get from file (correct password)
const wallet2 = Wallet.createWalletFromKeystore(password, './wallet/keystore.json');
console.log('Wallet from file', wallet2.getInfo());

// get from file (invalid password)
const invalidPassword = 'password';
const wallet3 = Wallet.createWalletFromKeystore(invalidPassword, './wallet/keystore.json');
if (wallet3) {
    console.log('Wallet from file', wallet3.getInfo());
} else {
    console.log('Cannot get wallet from file (invalid password)');
}

// Sign and verify
const message = "Test message";
const signature = wallet2.signMessage(message);
const verifyWallet2 = Wallet.verifySignature(message, signature, wallet2.publicKey);
console.log('Verify signature', verifyWallet2);