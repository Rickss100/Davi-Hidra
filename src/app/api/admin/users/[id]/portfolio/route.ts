import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { transactions, users } from '@/db/schema';
import { getAuthorizedContextOrNull, recordAuditLog, toSafeUserDTO } from '@/server/dal/auth-dal';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx || (ctx.actor.role !== 'admin' && ctx.actor.role !== 'collaborator')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const { id } = await props.params;
  const targetId = Number(id);
  if (!Number.isFinite(targetId) || targetId <= 0) {
    return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
  }

  const db = await getDb();
  const [targetUser] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!targetUser) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const userTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, targetId))
    .orderBy(desc(transactions.executedDate), desc(transactions.id));

  const totalInvested = userTransactions
    .filter((t) => t.type === 'buy' || t.type === 'aporte')
    .reduce((sum, t) => sum + (Number(t.totalValue) || (Number(t.quantity) * Number(t.price))), 0);

  await recordAuditLog({
    actorUserId: ctx.actor.id,
    targetUserId: targetId,
    action: 'ADMIN_INSPECT_PORTFOLIO',
    metadata: { targetEmail: targetUser.email, count: userTransactions.length }
  });

  return NextResponse.json({
    user: toSafeUserDTO(targetUser),
    totalTransactions: userTransactions.length,
    totalInvested,
    transactions: userTransactions.map((t) => ({
      id: t.id,
      assetCode: t.assetCode,
      type: t.type,
      quantity: Number(t.quantity),
      price: Number(t.price),
      totalValue: Number(t.totalValue) || (Number(t.quantity) * Number(t.price)),
      executedDate: t.executedDate,
      notes: t.notes
    }))
  });
}
