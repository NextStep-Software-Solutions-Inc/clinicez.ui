/**
 * PhilHealth Konsulta v1.1 PKA — XML Encryption Service
 *
 * Implements the same algorithm as the PHP demo kit
 * (ForEncryption/Demo Kit for PHP/EClaimsEncryption/PhilHealthEClaimsEncryptor.php).
 *
 * For passphrase-based encryption:
 *   key    = SHA-256(passphrase) [32 bytes raw binary]; padded with \0 to 32 bytes if shorter
 *   iv     = random 16 bytes
 *   cipher = AES-256-CBC with PHP-compatible padding to 32-byte block boundary:
 *            (padLen-1) null bytes + chr(padLen) as the final padding byte
 *
 * Output JSON matches the PHP demo kit output and spec Figure 1:
 *   { docMimeType: "<text/xml>", hash, key1: "", key2: "", iv, doc }
 */

import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import type { KonsultaEncryptedPayload } from "./types";

const BLOCK_SIZE = 32; // PHP uses AES-256-CBC padded to 32-byte block
const IV_LEN = 16;

function deriveKey(passphrase: string): Buffer {
    // SHA-256 always produces 32 bytes; spec says pad with 0x00 if < 32 bytes
    const hash = createHash("sha256").update(passphrase, "utf8").digest();
    if (hash.length >= 32) return hash.subarray(0, 32);
    const key = Buffer.alloc(32, 0);
    hash.copy(key);
    return key;
}

/**
 * PHP-compatible padding: always adds at least 1 byte.
 * Appends (padLen - 1) null bytes followed by chr(padLen).
 * Matches PhilHealthEClaimsEncryptor::pad() in the PHP demo kit.
 */
function phpPad(data: Buffer): Buffer {
    const padLen = BLOCK_SIZE - (data.length % BLOCK_SIZE);
    const padding = Buffer.alloc(padLen, 0);
    padding[padLen - 1] = padLen; // last byte = pad length (like PHP chr($pad))
    return Buffer.concat([data, padding]);
}

/**
 * For decryption of already-block-aligned encrypted data:
 * pads only if not already aligned (encrypted data should always be aligned).
 */
function alignPad(data: Buffer): Buffer {
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

    const plaintext = phpPad(Buffer.from(xml, "utf8"));

    const cipher = createCipheriv("aes-256-cbc", key, iv);
    cipher.setAutoPadding(false);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    const hash = createHash("sha256").update(xml, "utf8").digest("hex");

    const payload: KonsultaEncryptedPayload = {
        docMimeType: "<text/xml>",
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

    const paddedData = alignPad(encryptedData);

    const decipher = createDecipheriv("aes-256-cbc", key, iv);
    decipher.setAutoPadding(false);
    const decrypted = Buffer.concat([decipher.update(paddedData), decipher.final()]);

    // Strip null padding — PHP pads with (padLen-1) nulls + chr(padLen);
    // trimming at first null removes the padding region correctly.
    const nullPos = decrypted.indexOf(0);
    const trimmed = nullPos >= 0 ? decrypted.subarray(0, nullPos) : decrypted;

    return trimmed.toString("utf8");
}
