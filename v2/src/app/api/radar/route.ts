import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { assets, cachedPrices, fundamentals, userAssetNotes } from '@/db/schema';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';

export async function GET(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const typeFilter = (searchParams.get('type') || '').trim().toLowerCase();
  const query = (searchParams.get('q') || '').trim().toLowerCase();

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

  const items = allAssets
    .filter((a) => {
      if (typeFilter && typeFilter !== 'all') {
        const t = a.type.toLowerCase();
        if (typeFilter === 'acao' && !t.includes('acao')) return false;
        if (typeFilter === 'fii' && !t.includes('fii')) return false;
        if (typeFilter === 'stock' && !t.includes('stock')) return false;
        if (typeFilter === 'reit' && !t.includes('reit')) return false;
        if (typeFilter === 'fixed' && !t.includes('fixa') && !t.includes('fixed')) return false;
      }
      if (query) {
        return (
          a.code.toLowerCase().includes(query) ||
          a.name.toLowerCase().includes(query) ||
          (a.sector || '').toLowerCase().includes(query)
        );
      }
      return true;
    })
    .slice(0, 250)
    .map((a) => {
      const upper = a.code.toUpperCase();
      const f = fundMap.get(upper);
      const n = noteMap.get(upper);
      return {
        code: a.code,
        name: a.name,
        type: a.type,
        market: a.market,
        sector: a.sector,
        price: priceMap.get(upper) ?? 0,
        peRatio: f?.peRatio ? Number(f.peRatio) : null,
        pbRatio: f?.pbRatio ? Number(f.pbRatio) : null,
        pVpa: f?.pVpa ? Number(f.pVpa) : null,
        dividendYield: f?.dividendYield ? Number(f.dividendYield) : null,
        roe: f?.roe ? Number(f.roe) : null,
        vacancyRate: f?.vacancyRate ? Number(f.vacancyRate) : null,
        rateDescription: f?.rateDescription ?? null,
        liquidityType: f?.liquidityType ?? null,
        userRating: n?.rating ?? null,
        userNotes: n?.notes ?? ''
      };
    });

  return NextResponse.json({
    totalCatalog: allAssets.length,
    items
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const assetCode = String(body.assetCode || '').trim();
  const rating = Math.max(1, Math.min(5, Number(body.rating || 5)));
  const notes = String(body.notes || '').slice(0, 500);

  if (!assetCode) {
    return NextResponse.json({ error: 'INVALID_ASSET' }, { status: 400 });
  }

  const db = await getDb();
  await db
    .insert(userAssetNotes)
    .values({
      userId: ctx.portfolioOwner.id,
      assetCode,
      rating,
      notes,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: [userAssetNotes.userId, userAssetNotes.assetCode],
      set: {
        rating,
        notes,
        updatedAt: new Date()
      }
    });

  return NextResponse.json({ success: true });
}
