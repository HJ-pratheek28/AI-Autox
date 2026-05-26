import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync(process.env.ENCRYPTION_MASTER_KEY || 'default-fallback-secret-key-change-in-prod', 'salt', 32);

/**
 * Encrypts dynamic credentials object to high-security payload.
 * Concat auth tag + ciphertext for complete decryption integrity.
 */
export function encryptCredentials(credentials: Record<string, any>): { encrypted: Buffer; iv: Buffer } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  const finalPayload = Buffer.concat([tag, encrypted]);

  return { encrypted: finalPayload, iv };
}

/**
 * Decrypts symmetric buffer payload using IV.
 */
export function decryptCredentials(encryptedPayload: Buffer, iv: Buffer): Record<string, any> {
  const tag = encryptedPayload.subarray(0, 16);
  const ciphertext = encryptedPayload.subarray(16);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
  
  return JSON.parse(decrypted.toString('utf8'));
}
