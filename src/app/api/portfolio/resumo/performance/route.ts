import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { buildPortfolioSnapshot } from '@/server/engines/portfolio.service';
import { buildResumoPerformance } from '@/server/engines/resumo.service';

const querySchema = z.object({
  period: z.enum(['6m', 'ytd', '12m', '24m', 'total']).default('12m')
});

export async function GET(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = querySchema.safeParse({
    period: new URL(request.url).searchParams.get('period') ?? undefined
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Período inválido. Use 6m, ytd, 12m, 24m ou total.' },
      { status: 400 }
    );
  }

  // Anti-IDOR: a carteira vem exclusivamente do contexto autenticado no servidor
  const ownerId = ctx.portfolioOwner.id;
  const snapshot = await buildPortfolioSnapshot(ownerId);
  const performance = await buildResumoPerformance(ownerId, parsed.data.period, snapshot);

  return NextResponse.json({ performance });
}
