import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { env } from '@/env';
import { checkRateLimit, resetRateLimit } from '@/server/rate-limit';
import {
  createServerSessionAndCookie,
  getRequestIp,
  recordAuditLog,
  toSafeUserDTO
} from '@/server/dal/auth-dal';
import { CHALLENGE_2FA_COOKIE_NAME, signTwoFactorChallenge } from '@/server/session-token';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe seu e-mail ou login.'),
  password: z.string().min(1, 'Informe sua senha.')
});

export async function POST(request: Request) {
  try {
    const ip = await getRequestIp();
    const limit = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'TOO_MANY_ATTEMPTS',
          message: `Muitas tentativas de acesso. Aguarde ${limit.retryAfterSec}s por segurança.`
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Credenciais inválidas.' },
        { status: 400 }
      );
    }

    const cleanEmail = parsed.data.email.toLowerCase().trim();
    const db = await getDb();
    const found = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${cleanEmail}`)
      .limit(1);

    const userRow = found[0];
    if (!userRow) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'E-mail/login ou senha incorretos.' },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(parsed.data.password, userRow.passwordHash);
    if (!validPassword) {
      await recordAuditLog({
        actorUserId: userRow.id,
        action: 'AUTH_LOGIN_FAILED',
        ipAddress: ip
      });
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'E-mail/login ou senha incorretos.' },
        { status: 401 }
      );
    }

    if (userRow.status !== 'active') {
      return NextResponse.json(
        {
          error: 'ACCOUNT_INACTIVE',
          message: 'Sua conta encontra-se suspensa ou inativa. Contate seu consultor Private.'
        },
        { status: 403 }
      );
    }

    if (
      userRow.role === 'user' &&
      userRow.planPeriod !== 'lifetime' &&
      userRow.planExpiresAt &&
      userRow.planExpiresAt < new Date()
    ) {
      return NextResponse.json(
        {
          error: 'PLAN_EXPIRED',
          message: 'Seu período de assinatura encerrou. Fale com a equipe MANTFRAI para renovar.'
        },
        { status: 403 }
      );
    }

    resetRateLimit(`login:${ip}`);

    // Se o cliente ativou 2FA TOTP, exige código do aplicativo autenticador antes de emitir sessão plena
    if (userRow.totpEnabled && userRow.totpSecretEncrypted) {
      const challengeToken = await signTwoFactorChallenge(userRow.id, userRow.email);
      const cookieStore = await cookies();
      cookieStore.set(CHALLENGE_2FA_COOKIE_NAME, challengeToken, {
        httpOnly: true,
        secure: env.IS_PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: 5 * 60
      });

      return NextResponse.json({
        requires2FA: true,
        emailHint: userRow.email
      });
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userRow.id));

    await createServerSessionAndCookie(userRow);
    await recordAuditLog({
      actorUserId: userRow.id,
      action: 'AUTH_LOGIN_SUCCESS',
      ipAddress: ip,
      metadata: { twoFactor: false }
    });

    return NextResponse.json({
      requires2FA: false,
      user: toSafeUserDTO(userRow)
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('❌ [POST /api/auth/login]:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno ao processar autenticação.', detail: errorMsg },
      { status: 500 }
    );
  }
}
