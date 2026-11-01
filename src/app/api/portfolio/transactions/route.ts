import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { assets, transactions } from '@/db/schema';
import { resolveAssetDisplayName, resolveAssetSector } from '@/lib/asset-names';
import { d, roundCurrency, roundCurrencyStr, roundPriceStr, roundQuantityStr } from '@/lib/money';
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

const updateTxSchema = z.object({
  id: z.number().int().positive(),
  assetCode: z.string().trim().min(1).max(40),
  type: z.enum(['buy', 'sell', 'event']),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  totalValue: z.number().nonnegative().optional(),
  executedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(300).nullable().optional(),
  categoryHint: z.string().optional(),
  marketHint: z.enum(['BR', 'US']).optional()
});

const adjustPositionSchema = z.object({
  assetCode: z.string().trim().min(1).max(40),
  quantity: z.number().positive(),
  averagePrice: z.number().nonnegative(),
  executedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  keepDividends: z.boolean().optional().default(true),
  categoryHint: z.string().optional(),
  marketHint: z.enum(['BR', 'US']).optional()
});

async function ensureCatalogAsset(
  codeRaw: string,
  categoryHint?: string,
  marketHint?: 'BR' | 'US'
) {
  const code = codeRaw.trim().toUpperCase();
  const inferredType =
    categoryHint === 'fixed' ||
    code.includes('TESOURO') ||
    code.includes('SELIC') ||
    code.includes('CDB') ||
    code.includes('CDI') ||
    code.includes('CONTA_REMUNERADA') ||
    code.includes('LIQ_DIARIA') ||
    code.includes('RESERVA') ||
    code.includes('LCI') ||
    code.includes('LCA')
      ? 'Renda Fixa'
      : categoryHint === 'fiis' || /^[A-Z]{4}11B?$/.test(code)
        ? 'FII'
        : categoryHint === 'reits'
          ? 'REIT'
          : categoryHint === 'stocks' || marketHint === 'US'
            ? 'Stock'
            : 'Acao';

  const market =
    marketHint || (inferredType === 'Stock' || inferredType === 'REIT' ? 'US' : 'BR');

  const db = await getDb();
  await db
    .insert(assets)
    .values({
      code,
      name: resolveAssetDisplayName(code, null),
      type: inferredType,
      market,
      sector: resolveAssetSector(code, null) || 'Carteira'
    })
    .onConflictDoNothing();

  return code;
}

export async function GET(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const assetFilter = (searchParams.get('assetCode') || '').trim().toUpperCase();

  const db = await getDb();
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, ctx.portfolioOwner.id))
    .orderBy(desc(transactions.executedDate), desc(transactions.id));

  const filtered = assetFilter
    ? rows.filter((r) => r.assetCode.trim().toUpperCase() === assetFilter)
    : rows;

  return NextResponse.json({
    items: filtered.map((t) => ({
      id: t.id,
      assetCode: t.assetCode.trim().toUpperCase(),
      type: t.type as 'buy' | 'sell' | 'event',
      quantity: Number(d(t.quantity).toFixed(6)),
      price: roundCurrency(t.price),
      totalValue: roundCurrency(t.totalValue),
      executedDate: t.executedDate,
      notes: t.notes
    }))
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  if (ctx.portfolioOwner.status === 'suspended') {
    return NextResponse.json(
      {
        error: 'ACCOUNT_SUSPENDED',
        message: 'Sua conta está com status Suspenso. O registro de novos aportes está bloqueado.'
      },
      { status: 403 }
    );
  }

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
    const code = await ensureCatalogAsset(item.assetCode, item.categoryHint, item.marketHint);

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

export async function PATCH(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  if (ctx.portfolioOwner.status === 'suspended') {
    return NextResponse.json(
      {
        error: 'ACCOUNT_SUSPENDED',
        message: 'Sua conta está com status Suspenso. Alterações em transações estão bloqueadas.'
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateTxSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Dados inválidos para edição do lançamento.' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const targetUserId = ctx.portfolioOwner.id;
  const code = await ensureCatalogAsset(data.assetCode, data.categoryHint, data.marketHint);

  const computedTotal =
    data.type === 'event' && data.totalValue !== undefined && data.totalValue > 0
      ? d(data.totalValue)
      : d(data.quantity).mul(data.price);

  const db = await getDb();
  const updated = await db
    .update(transactions)
    .set({
      assetCode: code,
      type: data.type,
      quantity: roundQuantityStr(data.quantity),
      price: roundPriceStr(data.price),
      totalValue: roundCurrencyStr(computedTotal),
      executedDate: data.executedDate,
      notes: data.notes ?? null
    })
    .where(and(eq(transactions.id, data.id), eq(transactions.userId, targetUserId)))
    .returning();

  if (updated.length === 0) {
    return NextResponse.json({ error: 'NOT_FOUND_OR_FORBIDDEN' }, { status: 404 });
  }

  await recordAuditLog({
    actorUserId: ctx.actor.id,
    targetUserId,
    action: 'PORTFOLIO_TRANSACTION_UPDATED',
    metadata: {
      transactionId: data.id,
      assetCode: code,
      type: data.type,
      quantity: data.quantity,
      price: data.price,
      isAuditing: ctx.isAuditing
    }
  });

  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  if (ctx.portfolioOwner.status === 'suspended') {
    return NextResponse.json(
      {
        error: 'ACCOUNT_SUSPENDED',
        message: 'Sua conta está com status Suspenso. Ajustes de posições estão bloqueados.'
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = adjustPositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Dados inválidos para ajuste consolidado da posição.' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const targetUserId = ctx.portfolioOwner.id;
  const code = await ensureCatalogAsset(data.assetCode, data.categoryHint, data.marketHint);
  const today = new Date().toISOString().slice(0, 10);

  const db = await getDb();
  const existing = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, targetUserId));

  const idsToReplace = existing
    .filter((row) => {
      if (row.assetCode.trim().toUpperCase() !== code) return false;
      if (data.keepDividends && row.type === 'event') return false;
      return true;
    })
    .map((row) => row.id);

  if (idsToReplace.length > 0) {
    await db
      .delete(transactions)
      .where(and(eq(transactions.userId, targetUserId), inArray(transactions.id, idsToReplace)));
  }

  const totalCost = d(data.quantity).mul(data.averagePrice);
  await db.insert(transactions).values({
    userId: targetUserId,
    assetCode: code,
    type: 'buy',
    quantity: roundQuantityStr(data.quantity),
    price: roundPriceStr(data.averagePrice),
    totalValue: roundCurrencyStr(totalCost),
    executedDate: data.executedDate || today,
    notes: 'Posição consolidada ajustada manualmente'
  });

  await recordAuditLog({
    actorUserId: ctx.actor.id,
    targetUserId,
    action: 'PORTFOLIO_POSITION_ADJUSTED',
    metadata: {
      assetCode: code,
      replacedTransactions: idsToReplace.length,
      newQuantity: data.quantity,
      newAveragePrice: data.averagePrice,
      keepDividends: data.keepDividends,
      isAuditing: ctx.isAuditing
    }
  });

  return NextResponse.json({ success: true, replacedCount: idsToReplace.length });
}

export async function DELETE(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  if (ctx.portfolioOwner.status === 'suspended') {
    return NextResponse.json(
      {
        error: 'ACCOUNT_SUSPENDED',
        message: 'Sua conta está com status Suspenso. Exclusão de lançamentos está bloqueada.'
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get('id');
  const rawAssetCode = (searchParams.get('assetCode') || '').trim().toUpperCase();
  const targetUserId = ctx.portfolioOwner.id;
  const db = await getDb();

  // Modo 1: Exclusão completa de um ativo (apaga todos os aportes/operações daquele ticker sem gerar venda)
  if (rawAssetCode) {
    const userRows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, targetUserId));

    const matchingIds = userRows
      .filter((r) => r.assetCode.trim().toUpperCase() === rawAssetCode)
      .map((r) => r.id);

    if (matchingIds.length === 0) {
      return NextResponse.json({ error: 'NOT_FOUND_OR_FORBIDDEN' }, { status: 404 });
    }

    await db
      .delete(transactions)
      .where(and(eq(transactions.userId, targetUserId), inArray(transactions.id, matchingIds)));

    await recordAuditLog({
      actorUserId: ctx.actor.id,
      targetUserId,
      action: 'PORTFOLIO_ASSET_PURGED',
      metadata: {
        assetCode: rawAssetCode,
        deletedTransactions: matchingIds.length,
        isAuditing: ctx.isAuditing
      }
    });

    return NextResponse.json({ success: true, deletedCount: matchingIds.length });
  }

  // Modo 2: Exclusão de um lançamento específico pelo ID
  const txId = Number(rawId);
  if (!Number.isFinite(txId) || txId <= 0) {
    return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
  }

  const deleted = await db
    .delete(transactions)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, targetUserId)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'NOT_FOUND_OR_FORBIDDEN' }, { status: 404 });
  }

  await recordAuditLog({
    actorUserId: ctx.actor.id,
    targetUserId,
    action: 'PORTFOLIO_TRANSACTION_DELETED',
    metadata: {
      transactionId: txId,
      assetCode: deleted[0]?.assetCode,
      isAuditing: ctx.isAuditing
    }
  });

  return NextResponse.json({ success: true });
}
