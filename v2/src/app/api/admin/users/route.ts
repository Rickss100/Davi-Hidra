import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { transactions, users, userSessions } from '@/db/schema';
import {
  getAuthorizedContextOrNull,
  recordAuditLog,
  toSafeUserDTO
} from '@/server/dal/auth-dal';

function computePlanExpiry(period: string): Date | null {
  if (!period || period === 'lifetime') return null;
  const d = new Date();
  if (period === '1_month') d.setMonth(d.getMonth() + 1);
  else if (period === '3_months') d.setMonth(d.getMonth() + 3);
  else if (period === '6_months') d.setMonth(d.getMonth() + 6);
  else if (period === '1_year') d.setFullYear(d.getFullYear() + 1);
  else return null;
  return d;
}

export async function GET() {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx || (ctx.actor.role !== 'admin' && ctx.actor.role !== 'collaborator')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const db = await getDb();
  const [allUsers, txCounts] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    db
      .select({
        userId: transactions.userId,
        count: sql<number>`count(*)::int`
      })
      .from(transactions)
      .groupBy(transactions.userId)
  ]);

  const countMap = new Map(txCounts.map((c) => [c.userId, Number(c.count)]));

  return NextResponse.json({
    users: allUsers.map((u) => ({
      ...toSafeUserDTO(u),
      transactionsCount: countMap.get(u.id) ?? 0
    }))
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx || (ctx.actor.role !== 'admin' && ctx.actor.role !== 'collaborator')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const password = String(body.password || '').trim();
  const role = String(body.role || 'user');
  const planPeriod = String(body.planPeriod || 'lifetime');

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Informe nome, login/e-mail e senha (mín. 6 caracteres).' },
      { status: 400 }
    );
  }

  if (ctx.actor.role === 'collaborator' && role === 'admin') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Colaboradores não podem criar contas de Administrador.' },
      { status: 403 }
    );
  }

  const db = await getDb();
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'CONFLICT', message: 'Já existe um cliente cadastrado com este e-mail/login.' },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role,
      status: 'active',
      planPeriod,
      planExpiresAt: computePlanExpiry(planPeriod)
    })
    .returning();

  const created = inserted[0]!;
  await recordAuditLog({
    actorUserId: ctx.actor.id,
    targetUserId: created.id,
    action: 'ADMIN_USER_CREATED',
    metadata: { role, planPeriod }
  });

  return NextResponse.json({ user: toSafeUserDTO(created) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx || (ctx.actor.role !== 'admin' && ctx.actor.role !== 'collaborator')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const targetId = Number(body.id);
  if (!Number.isFinite(targetId) || targetId <= 0) {
    return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
  }

  const db = await getDb();
  const found = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  const target = found[0];
  if (!target) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  if (ctx.actor.role === 'collaborator' && (target.role === 'admin' || body.role === 'admin')) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Colaboradores não podem alterar contas de Administrador.' },
      { status: 403 }
    );
  }

  // Ação especial de Contingência Private: Resetar 2FA em caso de perda/troca de aparelho celular
  if (body.reset2FA === true) {
    if (ctx.actor.role !== 'admin' && target.role === 'admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    await db
      .update(users)
      .set({ totpEnabled: false, totpSecretEncrypted: null, updatedAt: new Date() })
      .where(eq(users.id, targetId));

    await recordAuditLog({
      actorUserId: ctx.actor.id,
      targetUserId: targetId,
      action: 'ADMIN_RESET_USER_2FA'
    });

    return NextResponse.json({ success: true, message: '2FA do cliente resetado com sucesso.' });
  }

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date()
  };

  if (body.name) updates.name = String(body.name).trim();
  if (body.status) updates.status = String(body.status);
  if (body.role) updates.role = String(body.role);
  if (body.planPeriod) {
    updates.planPeriod = String(body.planPeriod);
    updates.planExpiresAt = computePlanExpiry(String(body.planPeriod));
  }
  if (body.password && String(body.password).trim().length >= 6) {
    updates.passwordHash = await bcrypt.hash(String(body.password).trim(), 10);
  }

  const updated = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, targetId))
    .returning();

  if (body.status && body.status !== 'active') {
    await db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(userSessions.userId, targetId));
  }

  await recordAuditLog({
    actorUserId: ctx.actor.id,
    targetUserId: targetId,
    action: 'ADMIN_USER_UPDATED',
    metadata: {
      status: updates.status,
      role: updates.role,
      planPeriod: updates.planPeriod
    }
  });

  return NextResponse.json({ user: toSafeUserDTO(updated[0]!) });
}

export async function DELETE(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx || ctx.actor.role !== 'admin') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Apenas Administradores podem remover contas.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const targetId = Number(searchParams.get('id'));
  if (!Number.isFinite(targetId) || targetId <= 1 || targetId === ctx.actor.id) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Conta protegida contra exclusão.' },
      { status: 400 }
    );
  }

  const db = await getDb();
  await db.delete(users).where(eq(users.id, targetId));

  await recordAuditLog({
    actorUserId: ctx.actor.id,
    targetUserId: null,
    action: 'ADMIN_USER_DELETED',
    metadata: { deletedUserId: targetId }
  });

  return NextResponse.json({ success: true });
}
