import { sha256 } from "../wallet/helpers.js";

export function merkleRoot(transactions) {
    if (transactions.length === 0) {
        return "00".repeat(32);
    }

    let hashes = transactions.map((tx) => Buffer.from(tx.id(), "hex"));

    while (hashes.length > 1) {
        // Nieparzysta ilość skrótów to duplikujemy ostatni element
        if (hashes.length % 2 === 1) {
            hashes.push(hashes[hashes.length - 1]);
        }

        const newLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const concat = Buffer.concat([hashes[i], hashes[i + 1]]);
            const oneHash = sha256(sha256(concat));
            newLevel.push(oneHash);
        }
        hashes = newLevel;
    }

    // merkleRoot odpowiada poziomowi nadrzędnemu drzewa skrótów
    // wysyłamy go w LE bo w block serialize mamy reverse() BE
    return hashes[0].toString("hex");
}