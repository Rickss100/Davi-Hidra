import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { assets, cachedPrices, fundamentals, userAssetNotes } from '@/db/schema';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { resolveAssetDisplayName, resolveAssetSector } from '@/lib/asset-names';

function normalizeCategory(type: string, market: string, code: string): string {
  const t = type.toLowerCase();
  const m = market.toUpperCase();
  const c = code.toUpperCase();

  if (
    t.includes('fixa') ||
    t.includes('fixed') ||
    t.includes('tesouro') ||
    c.includes('TESOURO') ||
    c.includes('SELIC') ||
    c.includes('CDB')
  ) {
    return 'fixed';
  }
  if (t.includes('fii')) return 'fiis';
  if (t.includes('reit')) return 'reits';
  if (t.includes('stock') || m === 'US') return 'stocks';
  if (/^[A-Z]{4}11B?$/.test(c)) return 'fiis';
  return 'acoes';
}

export async function GET(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawType = (searchParams.get('type') || '').trim().toLowerCase();
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const minRatingParam = Number(searchParams.get('minRating') || 0);
  const minRating = Number.isFinite(minRatingParam) && minRatingParam > 0 ? minRatingParam : 0;
  const limitParam = Number(searchParams.get('limit') || 350);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(1600, limitParam) : 350;

  const normalizedFilter =
    rawType === 'acao' || rawType === 'acoes'
      ? 'acoes'
      : rawType === 'fii' || rawType === 'fiis'
        ? 'fiis'
        : rawType === 'stock' || rawType === 'stocks'
          ? 'stocks'
          : rawType === 'reit' || rawType === 'reits'
            ? 'reits'
            : rawType === 'fixed' || rawType === 'fixa'
              ? 'fixed'
              : '';

  const db = await getDb();
  const [allAssets, allFunds, allPrices, userNotes] = await Promise.all([
    db.select().from(assets),
    db.select().from(fundamentals),
    db.select().from(cachedPrices),
    db
      .select()
      .from(userAssetNotes)
      .where(eq(userAssetNotes.userId, ctx.portfolioOwner.id))
  ]);

  const fundMap = new Map(allFunds.map((f) => [f.assetCode.toUpperCase(), f]));
  const priceMap = new Map(allPrices.map((p) => [p.assetCode.toUpperCase(), Number(p.price)]));
  const noteMap = new Map(userNotes.map((n) => [n.assetCode.toUpperCase(), n]));

  const filtered = allAssets.filter((a) => {
    const cat = normalizeCategory(a.type, a.market, a.code);
    if (normalizedFilter && cat !== normalizedFilter) return false;

    if (minRating > 0) {
      const rating = noteMap.get(a.code.toUpperCase())?.rating ?? 0;
      if (rating < minRating) return false;
    }

    if (query) {
      const displayName = resolveAssetDisplayName(a.code, a.name).toLowerCase();
      const displaySector = (resolveAssetSector(a.code, a.sector) || '').toLowerCase();
      return (
        a.code.toLowerCase().includes(query) ||
        displayName.includes(query) ||
        displaySector.includes(query)
      );
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (query) {
      const aCode = a.code.toLowerCase();
      const bCode = b.code.toLowerCase();
      if (aCode === query && bCode !== query) return -1;
      if (bCode === query && aCode !== query) return 1;

      const aStarts = aCode.startsWith(query);
      const bStarts = bCode.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      const aNameStarts = resolveAssetDisplayName(a.code, a.name).toLowerCase().startsWith(query);
      const bNameStarts = resolveAssetDisplayName(b.code, b.name).toLowerCase().startsWith(query);
      if (aNameStarts && !bNameStarts) return -1;
      if (bNameStarts && !aNameStarts) return 1;
    }
    return a.code.localeCompare(b.code);
  });

  const items = filtered.slice(0, limit).map((a) => {
    const upper = a.code.toUpperCase();
    const f = fundMap.get(upper);
    const n = noteMap.get(upper);
    const category = normalizeCategory(a.type, a.market, a.code);
    return {
      code: a.code,
      name: resolveAssetDisplayName(a.code, a.name),
      type: a.type,
      category,
      market: a.market,
      sector: resolveAssetSector(a.code, a.sector),
      price: priceMap.get(upper) ?? 0,
      peRatio: f?.peRatio !== null && f?.peRatio !== undefined ? Number(f.peRatio) : null,
      pbRatio: f?.pbRatio !== null && f?.pbRatio !== undefined ? Number(f.pbRatio) : null,
      pVpa: f?.pVpa !== null && f?.pVpa !== undefined ? Number(f.pVpa) : null,
      dividendYield: (() => {
        if (f?.dividendYield === null || f?.dividendYield === undefined) return null;
        const val = Number(f.dividendYield);
        // Autocorreção DevSecOps: se ativo brasileiro vier como decimal (ex: 0.098 em vez de 9.8), normaliza para porcentagem
        if (a.market === 'BR' && val > 0 && val < 0.30 && a.type !== 'Renda Fixa' && a.code !== 'TESOURO_SELIC_2029') {
          return Number((val * 100).toFixed(2));
        }
        return val;
      })(),
      roe: f?.roe !== null && f?.roe !== undefined ? Number(f.roe) : null,
      roic: f?.roic !== null && f?.roic !== undefined ? Number(f.roic) : null,
      debtToEquity:
        f?.debtToEquity !== null && f?.debtToEquity !== undefined ? Number(f.debtToEquity) : null,
      vacancyRate:
        f?.vacancyRate !== null && f?.vacancyRate !== undefined ? Number(f.vacancyRate) : null,
      evEbit: f?.evEbit !== null && f?.evEbit !== undefined ? Number(f.evEbit) : null,
      evEbitda: f?.evEbitda !== null && f?.evEbitda !== undefined ? Number(f.evEbitda) : null,
      psr: f?.psr !== null && f?.psr !== undefined ? Number(f.psr) : null,
      roa: f?.roa !== null && f?.roa !== undefined ? Number(f.roa) : null,
      ebitMargin: f?.ebitMargin !== null && f?.ebitMargin !== undefined ? Number(f.ebitMargin) : null,
      profitMargin: f?.profitMargin !== null && f?.profitMargin !== undefined ? Number(f.profitMargin) : null,
      currentRatio: f?.currentRatio !== null && f?.currentRatio !== undefined ? Number(f.currentRatio) : null,
      netDebtEbitda: f?.netDebtEbitda !== null && f?.netDebtEbitda !== undefined ? Number(f.netDebtEbitda) : null,
      revenueGrowth: f?.revenueGrowth !== null && f?.revenueGrowth !== undefined ? Number(f.revenueGrowth) : null,
      revenueGrowth5y: f?.revenueGrowth5y !== null && f?.revenueGrowth5y !== undefined ? Number(f.revenueGrowth5y) : null,
      earningsGrowth: f?.earningsGrowth !== null && f?.earningsGrowth !== undefined ? Number(f.earningsGrowth) : null,
      payoutRatio: f?.payoutRatio !== null && f?.payoutRatio !== undefined ? Number(f.payoutRatio) : null,
      marketCap: f?.marketCap !== null && f?.marketCap !== undefined ? Number(f.marketCap) : null,
      capRate: f?.capRate !== null && f?.capRate !== undefined ? Number(f.capRate) : null,
      ffoYield: f?.ffoYield !== null && f?.ffoYield !== undefined ? Number(f.ffoYield) : null,
      liquidity: f?.liquidity !== null && f?.liquidity !== undefined ? Number(f.liquidity) : null,
      propertyCount: f?.propertyCount !== null && f?.propertyCount !== undefined ? Number(f.propertyCount) : null,
      pricePerSqm: f?.pricePerSqm !== null && f?.pricePerSqm !== undefined ? Number(f.pricePerSqm) : null,
      rentPerSqm: f?.rentPerSqm !== null && f?.rentPerSqm !== undefined ? Number(f.rentPerSqm) : null,
      rateDescription: f?.rateDescription ?? null,
      liquidityType: f?.liquidityType ?? null,
      userRating: n?.rating ?? null,
      userNotes: n?.notes ?? ''
    };
  });

  return NextResponse.json({
    totalCatalog: allAssets.length,
    totalMatched: filtered.length,
    items
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const assetCode = String(body.assetCode || '').trim();
  if (!assetCode) {
    return NextResponse.json({ error: 'INVALID_ASSET' }, { status: 400 });
  }

  // Permite rating de 0 a 5. Se rating for 0 ou null, a nota é removida/zerada
  const rawRating = body.rating !== undefined && body.rating !== null ? Number(body.rating) : null;
  const rating = rawRating !== null && !isNaN(rawRating) ? Math.max(0, Math.min(5, rawRating)) : 0;
  const notes = body.notes !== undefined ? String(body.notes || '').slice(0, 500) : undefined;

  const db = await getDb();

  // Se a nota foi zerada (rating === 0)
  if (rating === 0) {
    // Se não enviou notas de texto ou a anotação está vazia:
    if (notes === undefined || !notes.trim()) {
      const existing = await db
        .select()
        .from(userAssetNotes)
        .where(
          and(
            eq(userAssetNotes.userId, ctx.portfolioOwner.id),
            eq(userAssetNotes.assetCode, assetCode)
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0]?.notes?.trim()) {
        // Preserva o texto da anotação, zerando apenas a nota
        await db
          .update(userAssetNotes)
          .set({ rating: 0, updatedAt: new Date() })
          .where(
            and(
              eq(userAssetNotes.userId, ctx.portfolioOwner.id),
              eq(userAssetNotes.assetCode, assetCode)
            )
          );
      } else {
        // Se não há anotação textual prévia, exclui o registro completamente
        await db
          .delete(userAssetNotes)
          .where(
            and(
              eq(userAssetNotes.userId, ctx.portfolioOwner.id),
              eq(userAssetNotes.assetCode, assetCode)
            )
          );
      }

      return NextResponse.json({ success: true, rating: 0 });
    }
  }

  // Inserção ou atualização com nota (1 a 5) ou com anotação textual
  await db
    .insert(userAssetNotes)
    .values({
      userId: ctx.portfolioOwner.id,
      assetCode,
      rating,
      notes: notes ?? '',
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: [userAssetNotes.userId, userAssetNotes.assetCode],
      set: {
        rating,
        ...(notes !== undefined ? { notes } : {}),
        updatedAt: new Date()
      }
    });

  return NextResponse.json({ success: true, rating });
}
