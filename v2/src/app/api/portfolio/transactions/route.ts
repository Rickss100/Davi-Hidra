import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { assets, transactions } from '@/db/schema';
import { d, roundCurrencyStr, roundPriceStr, roundQuantityStr } from '@/lib/money';
import { getAuthorizedContextOrNull, recordAuditLog } from '@/server/dal/auth-dal';

const singleTxSchema = z.object({
  assetCode: z.string().trim().min(1).max(40),
  type: z.enum(['buy', 'sell', 'event']),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  totalValue: z.number().nonnegative().optional(),
  executedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(300).optional(),
  categoryHint: z.string().optional(),
  marketHint: z.enum(['BR', 'US']).optional()
});

const payloadSchema = z.union([
  singleTxSchema,
  z.object({ items: z.array(singleTxSchema).min(1).max(200) })
]);

export async function POST(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Dados da operação inválidos.' },
      { status: 400 }
    );
  }

  const list = 'items' in parsed.data ? parsed.data.items : [parsed.data];
  const db = await getDb();
  const targetUserId = ctx.portfolioOwner.id;
  const today = new Date().toISOString().slice(0, 10);

  for (const item of list) {
    const code = item.assetCode.trim();
    const upper = code.toUpperCase();
    const inferredType =
      item.categoryHint === 'fixed' || upper.includes('TESOURO') || upper.includes('SELIC') || upper.includes('CDB')
        ? 'Renda Fixa'
        : item.categoryHint === 'fiis' || /^[A-Z]{4}11B?$/.test(upper)
          ? 'FII'
          : item.categoryHint === 'reits'
            ? 'REIT'
            : item.categoryHint === 'stocks' || item.marketHint === 'US'
              ? 'Stock'
              : 'Acao';

    const market =
      item.marketHint ||
      (inferredType === 'Stock' || inferredType === 'REIT' ? 'US' : 'BR');

    await db
      .insert(assets)
      .values({
        code,
        name: code,
        type: inferredType,
        market,
        sector: 'Carteira'
      })
      .onConflictDoNothing();

    const computedTotal =
      item.totalValue !== undefined && item.totalValue > 0
        ? d(item.totalValue)
        : d(item.quantity).mul(item.price);

    await db.insert(transactions).values({
      userId: targetUserId,
      assetCode: code,
      type: item.type,
      quantity: roundQuantityStr(item.quantity),
      price: roundPriceStr(item.price),
      totalValue: roundCurrencyStr(computedTotal),
      executedDate: item.executedDate || today,
      notes: item.notes || null
    });
  }

  await recordAuditLog({
    actorUserId: ctx.actor.id,
    targetUserId,
    action: 'PORTFOLIO_TRANSACTIONS_CREATED',
    metadata: { count: list.length, isAuditing: ctx.isAuditing }
  });

  return NextResponse.json({ success: true, count: list.length }, { status: 201 });
}

export async function DELETE(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const txId = Number(searchParams.get('id'));
  if (!Number.isFinite(txId) || txId <= 0) {
    return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
  }

  const db = await getDb();
  const deleted = await db
    .delete(transactions)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, ctx.portfolioOwner.id)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'NOT_FOUND_OR_FORBIDDEN' }, { status: 404 });
  }

  await recordAuditLog({
    actorUserId: ctx.actor.id,
    targetUserId: ctx.portfolioOwner.id,
    action: 'PORTFOLIO_TRANSACTION_DELETED',
    metadata: { transactionId: txId }
  });

  return NextResponse.json({ success: true });
}
