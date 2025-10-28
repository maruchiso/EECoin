import crypto from 'crypto';
import fs from 'fs';

export function encryptPrivateKey(privateKeyHex, password) {
  const salt = crypto.randomBytes(16);          
  const iv = crypto.randomBytes(12);            
  const key = crypto.scryptSync(password, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const plaintext = Buffer.from(privateKeyHex, 'hex');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    kdf: 'scrypt',
    cipher: 'aes-256-gcm',
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: ciphertext.toString('hex'),
  };
}

export function decryptPrivateKey(keystore, password) {
  try {
  const salt = Buffer.from(keystore.salt, 'hex');
  const iv = Buffer.from(keystore.iv, 'hex');
  const tag = Buffer.from(keystore.tag, 'hex');
  const data = Buffer.from(keystore.data, 'hex');

  const key = crypto.scryptSync(password, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('hex');
  } catch (err) {
    console.warn('Invalid password');
    return null;
  }
}

export function saveKeystore(filePath, keystoreObj) {
  fs.writeFileSync(filePath, JSON.stringify(keystoreObj, null, 2));
}

export function loadKeystore(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
