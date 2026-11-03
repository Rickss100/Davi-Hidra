import crypto from 'crypto';
import { env } from '@/env';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i] ?? 0;
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i] ?? '';
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Gera um segredo Base32 criptograficamente seguro (160 bits, RFC 6238).
 */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

/**
 * Gera a URI otpauth:// compatível com Google Authenticator, Authy, 1Password e iCloud Keychain.
 */
export function buildTotpOtpAuthUri(accountEmail: string, secretBase32: string, issuer = 'MANTFRAI Private'): string {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30'
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Calcula o código TOTP de 6 dígitos para um determinado contador de tempo de 30s.
 */
export function computeTotpCode(secretBase32: string, timestampMs = Date.now(), stepOffset = 0): string {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(timestampMs / 1000 / 30) + stepOffset;

  const counterBuffer = Buffer.alloc(8);
  let remaining = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f;

  const binary =
    (((hmac[offset] ?? 0) & 0x7f) << 24) |
    (((hmac[offset + 1] ?? 0) & 0xff) << 16) |
    (((hmac[offset + 2] ?? 0) & 0xff) << 8) |
    ((hmac[offset + 3] ?? 0) & 0xff);

  const otp = binary % 1_000_000;
  return String(otp).padStart(6, '0');
}

/**
 * Verifica um código 2FA de 6 dígitos com tolerância de ±1 janela de 30s (anti-drift de relógio)
 * usando comparação em tempo constante (timingSafeEqual).
 */
export function verifyTotpCode(secretBase32: string, userCode: string, timestampMs = Date.now()): boolean {
  const normalized = String(userCode || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;

  const userBuf = Buffer.from(normalized, 'utf-8');

  for (const offset of [-1, 0, 1]) {
    const candidate = computeTotpCode(secretBase32, timestampMs, offset);
    const candidateBuf = Buffer.from(candidate, 'utf-8');
    if (candidateBuf.length === userBuf.length && crypto.timingSafeEqual(candidateBuf, userBuf)) {
      return true;
    }
  }
  return false;
}

/**
 * Criptografa o segredo TOTP com AES-256-GCM antes de gravar no PostgreSQL.
 */
export function encryptTotpSecret(plainSecret: string): string {
  const key = crypto.createHash('sha256').update(env.TOTP_ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainSecret, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptTotpSecret(cipherPayload: string): string {
  const parts = cipherPayload.split(':');
  if (parts.length !== 3) throw new Error('Payload TOTP criptografado inválido.');
  const [ivHex, tagHex, dataHex] = parts;
  const key = crypto.createHash('sha256').update(env.TOTP_ENCRYPTION_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex ?? '', 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex ?? '', 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex ?? '', 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf-8');
}
