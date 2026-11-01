import { NextResponse } from 'next/server';
import { env } from '@/env';
import { getDb } from '@/db';
import { cachedPrices, transactions } from '@/db/schema';
import { roundPriceStr } from '@/lib/money';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';

async function syncActiveTickersFromBrapi() {
  const db = await getDb();
  const txRows = await db.select({ assetCode: transactions.assetCode }).from(transactions);

  const b3Tickers = Array.from(
    new Set(
      txRows
        .map((r) => r.assetCode.trim().toUpperCase())
        .filter((code) => /^[A-Z]{4}\d{1,2}B?$/.test(code))
    )
  );

  let updatedCount = 0;
  const chunkSize = 10;

  for (let i = 0; i < b3Tickers.length; i += chunkSize) {
    const chunk = b3Tickers.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;

    try {
      const url = `https://brapi.dev/api/quote/${chunk.join(',')}?token=${env.BRAPI_TOKEN}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;

      const data = (await res.json()) as {
        results?: Array<{
          symbol?: string;
          regularMarketPrice?: number;
          regularMarketChangePercent?: number;
          currency?: string;
        }>;
      };

      for (const item of data.results || []) {
        if (!item.symbol || !item.regularMarketPrice || item.regularMarketPrice <= 0) continue;
        await db
          .insert(cachedPrices)
          .values({
            assetCode: item.symbol.toUpperCase(),
            price: roundPriceStr(item.regularMarketPrice),
            changePercent: String((item.regularMarketChangePercent ?? 0).toFixed(4)),
            currency: item.currency || 'BRL',
            source: 'brapi_live',
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: cachedPrices.assetCode,
            set: {
              price: roundPriceStr(item.regularMarketPrice),
              changePercent: String((item.regularMarketChangePercent ?? 0).toFixed(4)),
              source: 'brapi_live',
              updatedAt: new Date()
            }
          });
        updatedCount++;
      }
    } catch {
      // Isola falhas externas de rede sem interromper o sistema
    }
  }

  return { activeTickers: b3Tickers.length, updatedCount };
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const validCronSecret = authHeader === `Bearer ${env.CRON_SECRET}`;
  const sessionCtx = await getAuthorizedContextOrNull();

  if (!validCronSecret && !sessionCtx) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const result = await syncActiveTickersFromBrapi();
  return NextResponse.json({
    success: true,
    ...result,
    syncedAt: new Date().toISOString()
  });
}

export async function GET(request: Request) {
  return POST(request);
}
