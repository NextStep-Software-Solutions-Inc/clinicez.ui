/**
 * PhilHealth Konsulta v1.1 PKA — XML Encryption Service
 *
 * Implements the same algorithm as the PHP demo kit
 * (ForEncryption/Demo Kit for PHP/EClaimsEncryption/PhilHealthEClaimsEncryptor.php).
 *
 * For passphrase-based encryption:
 *   key   = SHA-256(passphrase)  [32 bytes raw binary]
 *   iv    = random 16 bytes
 *   cipher = AES-256-CBC with zero-padding to 32-byte block boundary
 *
 * Output JSON matches the PHP output structure:
 *   { docMimeType, hash, key1, key2, iv, doc }
 */

import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import type { KonsultaEncryptedPayload } from "./types";

const BLOCK_SIZE = 32; // PHP uses AES-256-CBC padded to 32-byte block
const IV_LEN = 16;

function deriveKey(passphrase: string): Buffer {
    return createHash("sha256").update(passphrase, "utf8").digest();
}

function zeroPad(data: Buffer): Buffer {
    const remainder = data.length % BLOCK_SIZE;
    if (remainder === 0) return data;
    const padLen = BLOCK_SIZE - remainder;
    return Buffer.concat([data, Buffer.alloc(padLen, 0)]);
}

/**
 * Encrypts an XML string using PhilHealth's AES-256-CBC passphrase scheme.
 * Returns a JSON string matching the PHP demo kit output.
 */
export function encryptXmlPayload(xml: string, cipherKey: string): string {
    const key = deriveKey(cipherKey);
    const iv = randomBytes(IV_LEN);

    const plaintext = zeroPad(Buffer.from(xml, "utf8"));

    const cipher = createCipheriv("aes-256-cbc", key, iv);
    cipher.setAutoPadding(false);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    const hash = createHash("sha256").update(xml, "utf8").digest("hex");

    const payload: KonsultaEncryptedPayload = {
        docMimeType: "text/xml",
        hash,
        key1: "",
        key2: "",
        iv: iv.toString("base64"),
        doc: encrypted.toString("base64"),
    };

    return JSON.stringify(payload);
}

/**
 * Decrypts a JSON-encoded payload produced by encryptXmlPayload().
 * Used for verification / testing only.
 */
export function decryptXmlPayload(encryptedJson: string, cipherKey: string): string {
    const key = deriveKey(cipherKey);
    const payload = JSON.parse(encryptedJson) as KonsultaEncryptedPayload;

    const iv = Buffer.from(payload.iv, "base64");
    const encryptedData = Buffer.from(payload.doc, "base64");

    const paddedData = zeroPad(encryptedData);

    const decipher = createDecipheriv("aes-256-cbc", key, iv);
    decipher.setAutoPadding(false);
    const decrypted = Buffer.concat([decipher.update(paddedData), decipher.final()]);

    // Strip null padding bytes appended during zero-padding
    const nullPos = decrypted.indexOf(0);
    const trimmed = nullPos >= 0 ? decrypted.subarray(0, nullPos) : decrypted;

    return trimmed.toString("utf8");
}
