import pkg from 'elliptic';
import crypto from 'crypto';

const {ec: EC} = pkg;
const ec = new EC('secp256k1');

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(buf) {
    // count zeros
    let count = 0;
    for (let i = 0; i < buf.length; i++) {
        if (buf[i] === 0) {
            count += 1;
        }
        else {
            break;
        }
    }
    // convert to BigInt
    let num = BigInt('0x' + Buffer.from(buf).toString('hex'));

    // encode to Base58
    let encoded = '';
    while (num > 0n) {
        const r = num % 58n;
        num = num / 58n;
        encoded = BASE58_ALPHABET[Number(r)] + encoded;
    }
    return '1'.repeat(count) + encoded;
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function ripemd160(buf) {
  return crypto.createHash('ripemd160').update(buf).digest();
}

function doubleSha256(buf) {
  return sha256(sha256(buf));
}

export function compressedPublicKeyFromKeyPair(keyPair) {
  const publicKey = keyPair.getPublic();
  const x = publicKey.getX().toString('hex').padStart(64, '0');
  let prefix = '00';
  if (publicKey.getY().isEven()) prefix = '02';
  else prefix = '03';
  return prefix + x;
}

export function publicKeyToAddress(publicKeyHex, network = 'testnet') { 
  const pubBuf = Buffer.from(publicKeyHex, 'hex');
  const h1 = sha256(pubBuf);
  const h160 = ripemd160(h1); // 20bytes
  const prefix = network === 'mainnet' ? 0x00 : 0x6f; 
  const versioned = Buffer.concat([Buffer.from([prefix]), h160]); // 20 + 1
  const checksum = doubleSha256(versioned).subarray(0, 4);
  const payload = Buffer.concat([versioned, checksum]); // 21 + 4
  return encodeBase58(payload);
}

// I implemented compressed sec, so I will add 0x01
export function privateKeyToWIF(privateKeyHex, network = 'testnet') {
  const prefix = network === 'mainnet' ? 0x80 : 0xef;
  let privBuf = Buffer.from(privateKeyHex, 'hex');
  if (privBuf.length < 32) {
    const padding = Buffer.alloc(32 - privBuf.length, 0);
    privBuf = Buffer.concat([padding, privBuf]);
  }
  let payload = Buffer.concat([Buffer.from([prefix]), privBuf]);
  payload = Buffer.concat([payload, Buffer.from([0x01])]);
  const checksum = doubleSha256(payload).subarray(0, 4);
  const full = Buffer.concat([payload, checksum]);
  return encodeBase58(full);
}