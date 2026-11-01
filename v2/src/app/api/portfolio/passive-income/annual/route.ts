import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { buildAnnualDividendHeatmap } from '@/server/engines/passive-income.engine';
import { buildPortfolioSnapshot, loadDividendEvents } from '@/server/engines/portfolio.service';

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear())
});

export async function GET(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    year: url.searchParams.get('year') || new Date().getFullYear()
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Informe um ano válido entre 2000 e 2100.' },
      { status: 400 }
    );
  }

  // Anti-IDOR: dados derivados exclusivamente do proprietário da carteira autenticado
  const ownerId = ctx.portfolioOwner.id;
  const [snapshot, events] = await Promise.all([
    buildPortfolioSnapshot(ownerId),
    loadDividendEvents(ownerId)
  ]);

  const heatmap = buildAnnualDividendHeatmap({
    events,
    holdings: snapshot.flatHoldings,
    year: parsed.data.year,
    today: new Date().toISOString().slice(0, 10)
  });

  return NextResponse.json({ heatmap, totalEventsRegistered: events.length });
}
