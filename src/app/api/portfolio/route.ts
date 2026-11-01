import { NextResponse } from 'next/server';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { buildPortfolioSnapshot } from '@/server/engines/portfolio.service';

export async function GET() {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const snapshot = await buildPortfolioSnapshot(ctx.portfolioOwner.id);
  return NextResponse.json({
    context: ctx,
    snapshot
  });
}
