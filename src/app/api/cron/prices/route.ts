import { NextResponse } from 'next/server';
import { env } from '@/env';
import { getDb } from '@/db';
import { cachedPrices, transactions, userObjectives } from '@/db/schema';
import { roundPriceStr } from '@/lib/money';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';

async function syncActiveTickersFromBrapi() {
  const db = await getDb();

  // 1. Tickers de transações
  const txRows = await db.select({ assetCode: transactions.assetCode }).from(transactions);

  // 2. Tickers de objetivos de carteira de todos os usuários
  const objRows = await db.select({ assetTargets: userObjectives.assetTargets }).from(userObjectives);

  // 3. Tickers essenciais do Método MANTFRAI (Brasil e EUA)
  const CORE_MANTFRAI_TICKERS = [
    'BBAS3', 'ITUB3', 'ITUB4', 'EGIE3', 'TAEE11', 'WEGE3', 'SAPR11', 'VALE3',
    'HGLG11', 'KNRI11', 'ALZR11', 'XPML11', 'XPLG11', 'MXRF11',
    'AAPL', 'MSFT', 'JNJ', 'O', 'PLD'
  ];

  const candidateTickers = new Set<string>(CORE_MANTFRAI_TICKERS);

  for (const r of txRows) {
    const code = r.assetCode?.trim().toUpperCase();
    if (code && !code.startsWith('TESOURO') && !code.startsWith('CDB')) {
      candidateTickers.add(code);
    }
  }

  for (const row of objRows) {
    const targets = row.assetTargets as unknown as Record<string, Array<{ code: string }>> | null;
    if (targets && typeof targets === 'object') {
      for (const list of Object.values(targets)) {
        if (Array.isArray(list)) {
          for (const item of list) {
            const code = item?.code?.trim().toUpperCase();
            if (code && !code.startsWith('TESOURO') && !code.startsWith('CDB')) {
              candidateTickers.add(code);
            }
          }
        }
      }
    }
  }

  const allTickers = Array.from(candidateTickers);
  let updatedCount = 0;

  // Consulta individual resiliente (Brapi plano gratuito limita a 1 ativo por chamada)
  for (const ticker of allTickers) {
    try {
      const url = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?token=${env.BRAPI_TOKEN}`;
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

      const item = data.results?.[0];
      if (item && item.regularMarketPrice && item.regularMarketPrice > 0) {
        await db
          .insert(cachedPrices)
          .values({
            assetCode: (item.symbol || ticker).toUpperCase(),
            price: roundPriceStr(item.regularMarketPrice),
            changePercent: String((item.regularMarketChangePercent ?? 0).toFixed(4)),
            currency: item.currency || (ticker.length <= 4 && !/\d/.test(ticker) ? 'USD' : 'BRL'),
            source: 'brapi_live',
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: cachedPrices.assetCode,
            set: {
              price: roundPriceStr(item.regularMarketPrice),
              changePercent: String((item.regularMarketChangePercent ?? 0).toFixed(4)),
              currency: item.currency || (ticker.length <= 4 && !/\d/.test(ticker) ? 'USD' : 'BRL'),
              source: 'brapi_live',
              updatedAt: new Date()
            }
          });
        updatedCount++;
      }
    } catch {
      // Isola falhas individuais sem interromper a sincronização dos demais
    }
  }

  return { activeTickers: allTickers.length, updatedCount };
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
