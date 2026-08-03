import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Secret key must be 32 bytes (256 bits).
// Derive key using SHA-256 from ENCRYPTION_KEY or fallback to JWT_SECRET / default secret.
const SECRET_KEY = crypto
    .createHash('sha256')
    .update(process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'arise_phis_secret_key_default_32b')
    .digest();

export const encrypt = (text) => {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        // Return format: iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err) {
        console.error('Encryption error:', err);
        return text;
    }
};

export const decrypt = (encryptedText) => {
    if (!encryptedText) return encryptedText;
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            // Not in iv:authTag:encrypted format (e.g. legacy plain text)
            return encryptedText;
        }
        const [ivHex, authTagHex, encryptedDataHex] = parts;
        if (ivHex.length !== 24 || authTagHex.length !== 32) {
            // Unrecognized structure, return original text
            return encryptedText;
        }
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // Return as is if decryption fails (e.g. plain text or corrupted)
        return encryptedText;
    }
};
