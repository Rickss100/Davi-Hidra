import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { checkRateLimit } from '@/server/rate-limit';
import {
  createServerSessionAndCookie,
  getRequestIp,
  recordAuditLog,
  toSafeUserDTO
} from '@/server/dal/auth-dal';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
  email: z.string().trim().email('Informe um e-mail válido.').max(160),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.')
});

export async function POST(request: Request) {
  try {
    const ip = await getRequestIp();
    const limit = checkRateLimit(`register:${ip}`, 5, 30 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'TOO_MANY_REQUESTS', message: 'Muitas solicitações. Tente novamente mais tarde.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Dados de cadastro inválidos.';
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: firstIssue }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.data.email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'EMAIL_EXISTS', message: 'Já existe uma conta cadastrada com este e-mail.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const inserted = await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        role: 'user',
        status: 'active',
        planPeriod: 'lifetime',
        lastLoginAt: new Date()
      })
      .returning();

    const createdUser = inserted[0];
    if (!createdUser) throw new Error('Falha ao gravar usuário.');

    await createServerSessionAndCookie(createdUser);
    await recordAuditLog({
      actorUserId: createdUser.id,
      action: 'AUTH_REGISTER_SUCCESS',
      ipAddress: ip
    });

    return NextResponse.json(
      { success: true, user: toSafeUserDTO(createdUser) },
      { status: 201 }
    );
  } catch (err) {
    console.error('❌ [POST /api/auth/register]:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao criar conta.' },
      { status: 500 }
    );
  }
}
