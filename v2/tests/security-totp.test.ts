import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  buildTotpOtpAuthUri,
  computeTotpCode,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotpCode
} from '@/lib/totp';
import {
  signSessionToken,
  signTwoFactorChallenge,
  verifySessionToken,
  verifyTwoFactorChallenge
} from '@/server/session-token';

describe('Segurança 2FA TOTP (RFC 6238) & Criptografia AES-256-GCM', () => {
  it('codifica e decodifica Base32 sem perda de entropia', () => {
    const original = Buffer.from('NorteInvestPrivateBanking2026!', 'utf-8');
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);
    expect(decoded.equals(original)).toBe(true);
  });

  it('gera URI otpauth:// compatível com Google Authenticator, Authy e iPhone', () => {
    const secret = generateTotpSecret();
    expect(secret.length).toBeGreaterThanOrEqual(32);

    const uri = buildTotpOtpAuthUri('cliente@norteinvest.com', secret);
    expect(uri.startsWith('otpauth://totp/')).toBe(true);
    expect(uri).toContain(`secret=${secret}`);
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });

  it('valida códigos TOTP dentro da janela de tolerância (±30s) e rejeita códigos expirados ou inválidos', () => {
    const secret = generateTotpSecret();
    const fixedTime = 1_760_000_000_000;

    const currentCode = computeTotpCode(secret, fixedTime, 0);
    const prevWindowCode = computeTotpCode(secret, fixedTime, -1);
    const expiredCode = computeTotpCode(secret, fixedTime, -3);

    expect(verifyTotpCode(secret, currentCode, fixedTime)).toBe(true);
    expect(verifyTotpCode(secret, prevWindowCode, fixedTime)).toBe(true);
    expect(verifyTotpCode(secret, expiredCode, fixedTime)).toBe(false);
    expect(verifyTotpCode(secret, 'abc123', fixedTime)).toBe(false);
  });

  it('criptografa segredo 2FA em repouso com AES-256-GCM e bloqueia qualquer adulteração de AuthTag', () => {
    const plainSecret = generateTotpSecret();
    const encrypted = encryptTotpSecret(plainSecret);

    expect(encrypted).not.toContain(plainSecret);
    expect(encrypted.split(':')).toHaveLength(3);
    expect(decryptTotpSecret(encrypted)).toBe(plainSecret);

    // Simula adulteração de 1 byte no payload criptografado no banco
    const [iv, authTag, cipherHex] = encrypted.split(':');
    const tamperedHex =
      (cipherHex?.startsWith('a') ? 'b' : 'a') + (cipherHex?.slice(1) ?? '');
    const tamperedPayload = `${iv}:${authTag}:${tamperedHex}`;

    expect(() => decryptTotpSecret(tamperedPayload)).toThrow();
  });
});

describe('Tokens Zero-Trust HttpOnly (HMAC-SHA256 / jose)', () => {
  it('assina e verifica token de sessão completo e rejeita assinatura adulterada', async () => {
    const token = await signSessionToken({
      sid: 'sess-uuid-1234',
      uid: 1000001,
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      role: 'user',
      name: 'Investidor Private',
      email: 'private@norteinvest.com',
      impUid: null
    });

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.uid).toBe(1000001);
    expect(verified?.role).toBe('user');

    // Adulteração do payload JWT (tentativa de escalar privilégio para admin)
    const parts = token.split('.');
    const fakePayload = Buffer.from(
      JSON.stringify({ sid: 'sess-uuid-1234', uid: 1000001, role: 'admin' })
    ).toString('base64url');
    const forgedToken = `${parts[0]}.${fakePayload}.${parts[2]}`;

    expect(await verifySessionToken(forgedToken)).toBeNull();
  });

  it('isola estritamente o token temporário de desafio 2FA do token de sessão autenticada', async () => {
    const challengeToken = await signTwoFactorChallenge(1000005, 'admin@norteinvest.com');

    // Um token de pré-autenticação 2FA JAMAIS pode ser aceito como sessão completa
    expect(await verifySessionToken(challengeToken)).toBeNull();

    const verifiedChallenge = await verifyTwoFactorChallenge(challengeToken);
    expect(verifiedChallenge?.uid).toBe(1000005);
    expect(verifiedChallenge?.purpose).toBe('2fa_challenge');
  });
});
