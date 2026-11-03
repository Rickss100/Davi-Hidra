import { NextResponse } from 'next/server';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { buildPortfolioSnapshot } from '@/server/engines/portfolio.service';

export async function GET() {
  try {
    const ctx = await getAuthorizedContextOrNull();
    if (!ctx) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const snapshot = await buildPortfolioSnapshot(ctx.portfolioOwner.id);
    return NextResponse.json({
      context: ctx,
      snapshot
    });
  } catch (err: unknown) {
    console.error('❌ [GET /api/portfolio Error]:', err);
    return NextResponse.json(
      {
        error: 'PORTFOLIO_CONSOLIDATION_ERROR',
        message: 'Erro ao consolidar patrimônio em tempo real.',
        detail: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}
