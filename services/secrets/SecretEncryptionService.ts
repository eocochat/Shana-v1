import crypto from 'crypto';

const MASTER_KEY = process.env.SHANA_ENCRYPTION_KEY || 'shana-fallback-encryption-master-key-secure';

export class SecretEncryptionService {
  private static getKey(): Buffer {
    // Generate a secure 32-byte key from the master key
    return crypto.createHash('sha256').update(MASTER_KEY).digest();
  }

  /**
   * Encrypts plaintext using AES-256-CBC.
   * Returns a string in the format of iv:ciphertext
   */
  static encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypts ciphertext using AES-256-CBC.
   */
  static decrypt(cipherText: string): string {
    if (!cipherText) return '';
    const parts = cipherText.split(':');
    if (parts.length !== 2) {
      // If it's not encrypted or in a different format, return it directly
      return cipherText;
    }
    try {
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = Buffer.from(parts[1], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.getKey(), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString('utf8');
    } catch (err) {
      console.error('[SecretEncryptionService] Decryption failed:', err);
      return '';
    }
  }
}
