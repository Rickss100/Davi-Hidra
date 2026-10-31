import { NextResponse } from 'next/server';
import { z } from 'zod';
import { formatBRL } from '@/lib/money';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { suggestInvestments } from '@/server/engines/davi-hydra.engine';
import { buildPortfolioSnapshot } from '@/server/engines/portfolio.service';

const requestSchema = z.object({
  availableAmountBrl: z.number().positive('Informe um valor de aporte maior que zero.'),
  numAssets: z.number().int().min(1).max(10).default(3),
  prioritizeEmergencyReserve: z.boolean().default(false)
});

export async function POST(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Informe um valor válido para simulação.' },
      { status: 400 }
    );
  }

  const snapshot = await buildPortfolioSnapshot(ctx.portfolioOwner.id);

  const suggestions = suggestInvestments({
    availableAmountBrl: parsed.data.availableAmountBrl,
    numAssets: parsed.data.numAssets,
    holdings: snapshot.holdings,
    macroAllocation: snapshot.objectives.macroAllocation,
    assetTargets: snapshot.objectives.assetTargets,
    priceMapBrl: snapshot.priceMapBrl,
    emergencyReserveSummary: parsed.data.prioritizeEmergencyReserve
      ? snapshot.emergencyReserve
      : null,
    usdRate: snapshot.usdToBrl
  });

  const totalSuggestedBrl = suggestions.reduce((sum, s) => sum + s.valorTotal, 0);

  const lines = [
    `🏛️ *NORTE INVEST PRIVATE — Plano de Aporte Inteligente*`,
    `👤 Cliente: *${ctx.portfolioOwner.name}*`,
    `💰 Valor Disponível: *${formatBRL(parsed.data.availableAmountBrl)}*`,
    ``,
    `📊 *Ordens Sugeridas (Método DAVI & Hydra):*`
  ];

  suggestions.forEach((s, idx) => {
    const unitInfo =
      s.categoria === 'fixed'
        ? `Aplicação Direta`
        : `${s.cotas} cota(s) × ${formatBRL(s.currentPrice)}`;
    lines.push(`${idx + 1}. *${s.ticker}* — ${unitInfo} = *${formatBRL(s.valorTotal)}*`);
  });

  lines.push(``);
  lines.push(`✅ Total Alocado: *${formatBRL(totalSuggestedBrl)}*`);

  return NextResponse.json({
    suggestions,
    totalSuggestedBrl,
    whatsappSummary: lines.join('\n')
  });
}
