import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { decryptTotpSecret, verifyTotpCode } from '@/lib/totp';
import { checkRateLimit, resetRateLimit } from '@/server/rate-limit';
import { CHALLENGE_2FA_COOKIE_NAME, verifyTwoFactorChallenge } from '@/server/session-token';
import {
  createServerSessionAndCookie,
  getRequestIp,
  recordAuditLog,
  toSafeUserDTO
} from '@/server/dal/auth-dal';

const verifySchema = z.object({
  code: z.string().trim().min(6, 'Informe o código de 6 dígitos.')
});

export async function POST(request: Request) {
  try {
    const ip = await getRequestIp();
    const limit = checkRateLimit(`2fa:${ip}`, 8, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'TOO_MANY_ATTEMPTS',
          message: `Muitas tentativas de código 2FA. Aguarde ${limit.retryAfterSec}s.`
        },
        { status: 429 }
      );
    }

    const cookieStore = await cookies();
    const rawChallenge = cookieStore.get(CHALLENGE_2FA_COOKIE_NAME)?.value;
    const challenge = await verifyTwoFactorChallenge(rawChallenge);
    if (!challenge) {
      return NextResponse.json(
        { error: 'EXPIRED_CHALLENGE', message: 'Desafio 2FA expirado. Faça login novamente.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_CODE', message: 'Código de autenticação inválido.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const rows = await db.select().from(users).where(eq(users.id, challenge.uid)).limit(1);
    const userRow = rows[0];
    if (!userRow || !userRow.totpSecretEncrypted) {
      return NextResponse.json(
        { error: 'INVALID_STATE', message: 'Configuração 2FA não encontrada.' },
        { status: 400 }
      );
    }

    const secret = decryptTotpSecret(userRow.totpSecretEncrypted);
    const isValid = verifyTotpCode(secret, parsed.data.code);
    if (!isValid) {
      await recordAuditLog({
        actorUserId: userRow.id,
        action: 'AUTH_2FA_FAILED',
        ipAddress: ip
      });
      return NextResponse.json(
        { error: 'INVALID_2FA_CODE', message: 'Código 2FA incorreto ou expirado.' },
        { status: 401 }
      );
    }

    resetRateLimit(`2fa:${ip}`);
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userRow.id));

    await createServerSessionAndCookie(userRow);
    await recordAuditLog({
      actorUserId: userRow.id,
      action: 'AUTH_LOGIN_2FA_VERIFIED',
      ipAddress: ip
    });

    return NextResponse.json({
      success: true,
      user: toSafeUserDTO(userRow)
    });
  } catch (err) {
    console.error('❌ [POST /api/auth/verify-2fa]:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Falha ao validar código 2FA.' },
      { status: 500 }
    );
  }
}
