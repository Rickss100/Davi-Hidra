import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db';
import { fundamentals } from '@/db/schema';
import { resolveAssetDisplayName } from '@/lib/asset-names';
import { formatBRL } from '@/lib/money';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { suggestInvestments } from '@/server/engines/davi-hydra.engine';
import { buildPortfolioSnapshot } from '@/server/engines/portfolio.service';

const requestSchema = z.object({
  availableAmountBrl: z.number().positive('Informe um valor de aporte maior que zero.'),
  numAssets: z.number().int().min(1).max(10).default(2),
  reserveStrategy: z
    .enum(['focus_100', 'hybrid_70_30', 'hybrid_50_50', 'free'])
    .optional(),
  prioritizeEmergencyReserve: z.boolean().optional()
});

export async function POST(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Informe um valor maior que zero para simular o aporte.' },
      { status: 400 }
    );
  }

  const [snapshot, allFunds] = await Promise.all([
    buildPortfolioSnapshot(ctx.portfolioOwner.id),
    getDb().then((db) => db.select().from(fundamentals))
  ]);

  const fundMap = new Map(allFunds.map((f) => [f.assetCode.toUpperCase(), f]));

  // Define a estratégia da Reserva de Emergência escolhida na tela
  const effectiveStrategy =
    parsed.data.reserveStrategy ??
    (parsed.data.prioritizeEmergencyReserve === false
      ? 'free'
      : snapshot.emergencyReserve.strategyMode || 'hybrid_70_30');

  const reserveSummaryForCalc =
    effectiveStrategy !== 'free' &&
    snapshot.emergencyReserve.reserveStatus !== 'blindada'
      ? {
          ...snapshot.emergencyReserve,
          strategyMode: effectiveStrategy
        }
      : null;

  const rawSuggestions = suggestInvestments({
    availableAmountBrl: parsed.data.availableAmountBrl,
    numAssets: parsed.data.numAssets,
    holdings: snapshot.holdings,
    macroAllocation: snapshot.objectives.macroAllocation,
    assetTargets: snapshot.objectives.assetTargets,
    priceMapBrl: snapshot.priceMapBrl,
    emergencyReserveSummary: reserveSummaryForCalc,
    usdRate: snapshot.usdToBrl
  });

  // Auditoria Fundamentalista DAVI 100% no Servidor
  const suggestions = rawSuggestions.map((s) => {
    const upper = s.ticker.trim().toUpperCase();
    const assetName = resolveAssetDisplayName(s.ticker, null);
    if (s.categoria === 'fixed' || s.isEmergencyReserve) {
      return { ...s, assetName };
    }

    const f = fundMap.get(upper);
    let daviWarning: string | undefined;

    if (f) {
      const roe = f.roe !== null ? Number(f.roe) : null;
      const dy = f.dividendYield !== null ? Number(f.dividendYield) : null;
      const pvp =
        f.pVpa !== null
          ? Number(f.pVpa)
          : f.pbRatio !== null
            ? Number(f.pbRatio)
            : null;

      if (roe !== null && roe < 0) {
        daviWarning = `${s.ticker} apresenta ROE negativo (${roe.toFixed(1)}%). Revise os fundamentos antes de aportar.`;
      } else if (dy !== null && dy === 0 && (s.categoria === 'acoes' || s.categoria === 'fiis')) {
        daviWarning = `${s.ticker} está sem distribuição recente de proventos (DY 0%). Revise sua tese antes do aporte.`;
      } else if (s.categoria === 'fiis' && pvp !== null && pvp > 1.15) {
        daviWarning = `${s.ticker} negocia com P/VP de ${pvp.toFixed(2)}x (acima do teto DAVI de 1,15x para FIIs).`;
      }
    }

    let magicNumberText: string | undefined;
    const catHoldings = snapshot.holdings[s.categoria] || [];
    const currentHolding = catHoldings.find((h) => h.code.toUpperCase() === upper);
    const currentQty = currentHolding?.quantity || 0;
    const addedQty = s.cotas;
    const totalQtyAfter = currentQty + addedQty;

    // Obtém DY dos proventos 12m ou do cadastro fundamentalista (Aula 7.4 - Ponto Mágico)
    let effectiveDy: number | null = null;
    if (currentHolding && currentHolding.currentValueBrl > 0 && currentHolding.dividends12mBrl > 0) {
      effectiveDy = (currentHolding.dividends12mBrl / currentHolding.currentValueBrl) * 100;
    } else if (f && f.dividendYield !== null && Number(f.dividendYield) > 0) {
      effectiveDy = Number(f.dividendYield);
    }

    if (effectiveDy && effectiveDy > 0) {
      const magicShares = Math.ceil(1200 / effectiveDy);
      if (magicShares > 0) {
        if (totalQtyAfter >= magicShares) {
          magicNumberText = `🎉 Atinge o Ponto Mágico (${Math.round(totalQtyAfter)}/${magicShares} cotas)! O ativo passa a se pagar sozinho gerando novas cotas.`;
        } else {
          const missing = Math.ceil(magicShares - totalQtyAfter);
          const progress = Math.min(99, Math.round((totalQtyAfter / magicShares) * 100));
          magicNumberText = `Faltam ${missing} cotas para o Ponto Mágico (${progress}% da meta de ${magicShares} cotas).`;
        }
      }
    }

    return {
      ...s,
      assetName,
      daviWarning,
      magicNumberText
    };
  });

  const totalSuggestedBrl = suggestions.reduce((sum, s) => sum + s.valorTotal, 0);

  let emptyReason = '';
  if (suggestions.length === 0) {
    const t = snapshot.objectives.assetTargets;
    const totalTargetCount =
      (t.acoes?.length || 0) +
      (t.fiis?.length || 0) +
      (t.stocks?.length || 0) +
      (t.reits?.length || 0) +
      (t.fixed?.length || 0);

    if (totalTargetCount === 0) {
      emptyReason =
        'Você ainda não escolheu os ativos da sua carteira alvo! Siga a metodologia MANTFRAI: 1º filtre e escolha empresas/fundos no Radar de Ativos (Filtro MFS) e 2º defina os pesos em Definir Objetivos.';
    } else {
      emptyReason =
        'Nenhum ativo elegível abaixo da meta para este valor (verifique seus pesos em Definir Objetivos ou aumente o valor disponível para cobrir ao menos 1 cota).';
    }
  }

  const dateStr = new Date().toLocaleDateString('pt-BR');
  const lines = [
    `📊 *PLANO DE APORTE — MANTFRAI (MÉTODO ANTIFRÁGIL DE INVESTIMENTO)*`,
    `👤 Investidor: *${ctx.portfolioOwner.name}*`,
    `📅 Data: ${dateStr}`,
    `💰 Valor Disponível: *${formatBRL(parsed.data.availableAmountBrl)}*`,
    ``,
    `🎯 *ORDENS SUGERIDAS PELA RÉGUA DE EQUILÍBRIO:*`
  ];

  suggestions.forEach((s, idx) => {
    const unitInfo =
      s.categoria === 'fixed'
        ? `Aplicação Direta`
        : `${s.cotas} cota(s) × ${formatBRL(s.currentPrice)}`;
    lines.push(
      `${idx + 1}. *${s.ticker}* — ${unitInfo} ➔ *${formatBRL(s.valorTotal)}* (${s.reason})`
    );
  });

  lines.push(``);
  lines.push(`✅ *Total Alocado: ${formatBRL(totalSuggestedBrl)}*`);

  return NextResponse.json({
    suggestions,
    totalSuggestedBrl,
    emptyReason,
    whatsappSummary: lines.join('\n')
  });
}
