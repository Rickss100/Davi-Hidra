import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { buildDividendCalendar } from '@/server/engines/passive-income.engine';
import { buildPortfolioSnapshot, loadDividendEvents } from '@/server/engines/portfolio.service';

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

export async function GET(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    year: url.searchParams.get('year'),
    month: url.searchParams.get('month')
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Informe um mês (1–12) e um ano válidos.' },
      { status: 400 }
    );
  }

  // Anti-IDOR: carteira derivada exclusivamente do contexto autenticado no servidor
  const ownerId = ctx.portfolioOwner.id;
  const [snapshot, events] = await Promise.all([
    buildPortfolioSnapshot(ownerId),
    loadDividendEvents(ownerId)
  ]);

  const calendar = buildDividendCalendar({
    events,
    holdings: snapshot.flatHoldings,
    year: parsed.data.year,
    month: parsed.data.month,
    today: new Date().toISOString().slice(0, 10)
  });

  return NextResponse.json({ calendar, totalEventsRegistered: events.length });
}
