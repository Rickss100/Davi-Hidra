import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { projectFutureIncome } from '@/server/engines/passive-income.engine';
import { buildPortfolioSnapshot } from '@/server/engines/portfolio.service';

const querySchema = z.object({
  months: z.coerce.number().int().min(1).max(480),
  monthlyContributionBrl: z.coerce.number().min(0).max(10_000_000),
  dividendYieldPercent: z.coerce.number().min(0).max(30),
  appreciationPercent: z.coerce.number().min(0).max(20).default(4),
  reinvest: z.enum(['true', 'false']).transform((v) => v === 'true')
});

export async function GET(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    months: url.searchParams.get('months'),
    monthlyContributionBrl: url.searchParams.get('monthlyContributionBrl'),
    dividendYieldPercent: url.searchParams.get('dividendYieldPercent'),
    appreciationPercent: url.searchParams.get('appreciationPercent') ?? undefined,
    reinvest: url.searchParams.get('reinvest') ?? 'true'
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Revise os parâmetros: prazo de 1 a 480 meses, aporte ≥ 0 e DY entre 0% e 30%.'
      },
      { status: 400 }
    );
  }

  // Patrimônio inicial e custo de vida vêm do servidor (Zero-Trust), nunca do cliente
  const snapshot = await buildPortfolioSnapshot(ctx.portfolioOwner.id);

  const forecast = projectFutureIncome({
    currentEquityBrl: snapshot.totalEquityBrl,
    monthlyContributionBrl: parsed.data.monthlyContributionBrl,
    months: parsed.data.months,
    dividendYieldAnnualPercent: parsed.data.dividendYieldPercent,
    appreciationAnnualPercent: parsed.data.appreciationPercent,
    reinvest: parsed.data.reinvest,
    monthlyExpenseBrl: snapshot.objectives.emergencyConfig.monthlyExpense
  });

  return NextResponse.json({ forecast });
}
