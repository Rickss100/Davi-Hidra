import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { getAuthorizedContextOrNull, getRequestIp, recordAuditLog } from '@/server/dal/auth-dal';
import { checkRateLimit } from '@/server/rate-limit';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual.'),
    newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'A confirmação de senha não confere.',
    path: ['confirmPassword']
  });

export async function POST(request: Request) {
  try {
    const ctx = await getAuthorizedContextOrNull();
    if (!ctx) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada.' },
        { status: 401 }
      );
    }

    const ip = await getRequestIp();
    const limit = checkRateLimit(`change_pw:${ctx.actor.id}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas. Aguarde alguns minutos.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Dados inválidos.';
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: firstIssue }, { status: 400 });
    }

    const db = await getDb();
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.actor.id))
      .limit(1);

    const userRow = userRows[0];
    if (!userRow) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const isCurrentValid = await bcrypt.compare(parsed.data.currentPassword, userRow.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'INVALID_CURRENT_PASSWORD', message: 'A senha atual informada está incorreta.' },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userRow.id));

    await recordAuditLog({
      actorUserId: userRow.id,
      action: 'AUTH_PASSWORD_CHANGED',
      ipAddress: ip
    });

    return NextResponse.json({
      success: true,
      message: 'Sua senha foi alterada com sucesso!'
    });
  } catch (err: unknown) {
    console.error('❌ [POST /api/auth/change-password]:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao alterar senha.' },
      { status: 500 }
    );
  }
}
