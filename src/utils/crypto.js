const crypto = require('crypto');

// Encryption Settings
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'billora-default-32-chars-key-2026-safe'; // Must be 32 chars
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypt sensitive text
 * @param {string} text 
 * @returns {string} iv:encryptedData
 */
function encrypt(text) {
    if (!text) return null;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Encryption Error:', error);
        return null;
    }
}

/**
 * Decrypt sensitive text
 * @param {string} textFormat (iv:encryptedData)
 * @returns {string} decrypted text
 */
function decrypt(textFormat) {
    if (!textFormat) return null;
    try {
        const textParts = textFormat.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption Error:', error);
        return null;
    }
}

module.exports = { encrypt, decrypt };
