import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { and, eq, gt } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, userSessions } from '@/db/schema';
import { recordAuditLog } from '@/server/dal/auth-dal';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const rawToken = String(body.token || '').trim();
  const newPassword = String(body.password || '');

  if (!rawToken || newPassword.length < 8) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Token inválido ou senha menor que 8 caracteres.' },
      { status: 400 }
    );
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const db = await getDb();
  const found = await db
    .select()
    .from(users)
    .where(and(eq(users.resetTokenHash, tokenHash), gt(users.resetExpiresAt, new Date())))
    .limit(1);

  const userRow = found[0];
  if (!userRow) {
    return NextResponse.json(
      { error: 'INVALID_OR_EXPIRED_TOKEN', message: 'Link de recuperação inválido ou expirado.' },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash,
      resetTokenHash: null,
      resetExpiresAt: null,
      updatedAt: new Date()
    })
    .where(eq(users.id, userRow.id));

  // Revoga todas as sessões anteriores por segurança
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(userSessions.userId, userRow.id));

  await recordAuditLog({
    actorUserId: userRow.id,
    action: 'AUTH_PASSWORD_RESET_COMPLETED'
  });

  return NextResponse.json({
    success: true,
    message: 'Senha redefinida com sucesso. Todas as sessões anteriores foram encerradas.'
  });
}
