import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'norte_session';
export const CHALLENGE_2FA_COOKIE_NAME = 'norte_2fa_pending';

export interface SessionTokenPayload {
  sid: string;
  uid: number;
  uuid: string;
  role: 'admin' | 'collaborator' | 'user';
  name: string;
  email: string;
  impUid?: number | null;
}

export interface TwoFactorChallengePayload {
  uid: number;
  email: string;
  purpose: '2fa_challenge';
}

function getSecretKey(): Uint8Array {
  const raw =
    process.env.SESSION_SECRET ||
    process.env.TURSO_AUTH_TOKEN ||
    'norte-invest-v2-local-dev-seed-do-not-use-in-cloud-32bytes';
  return new TextEncoder().encode(raw);
}

export async function signSessionToken(payload: SessionTokenPayload, expiresIn = '7d'): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256']
    });
    if (!payload.sid || !payload.uid || !payload.role) return null;
    return {
      sid: String(payload.sid),
      uid: Number(payload.uid),
      uuid: String(payload.uuid || ''),
      role: payload.role as 'admin' | 'collaborator' | 'user',
      name: String(payload.name || ''),
      email: String(payload.email || ''),
      impUid: payload.impUid ? Number(payload.impUid) : null
    };
  } catch {
    return null;
  }
}

export async function signTwoFactorChallenge(uid: number, email: string): Promise<string> {
  return await new SignJWT({ uid, email, purpose: '2fa_challenge' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(getSecretKey());
}

export async function verifyTwoFactorChallenge(
  token: string | undefined | null
): Promise<TwoFactorChallengePayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256']
    });
    if (payload.purpose !== '2fa_challenge' || !payload.uid) return null;
    return {
      uid: Number(payload.uid),
      email: String(payload.email || ''),
      purpose: '2fa_challenge'
    };
  } catch {
    return null;
  }
}
