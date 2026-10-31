import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/env';
import { formatBRL, formatPercent } from '@/lib/money';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { buildPortfolioSnapshot } from '@/server/engines/portfolio.service';

export async function POST(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const message = String(body.message || '').trim().slice(0, 1000);
  if (!message) {
    return NextResponse.json({ error: 'EMPTY_MESSAGE' }, { status: 400 });
  }

  const snapshot = await buildPortfolioSnapshot(ctx.portfolioOwner.id);
  const topHoldings = snapshot.flatHoldings
    .slice(0, 6)
    .map((h) => `${h.code} (${formatPercent(h.portfolioWeightPercent)})`)
    .join(', ');

  const portfolioBrief = [
    `Cliente: ${ctx.portfolioOwner.name}`,
    `Patrimônio Total: ${formatBRL(snapshot.totalEquityBrl)}`,
    `Valor Investido: ${formatBRL(snapshot.totalInvestedBrl)}`,
    `Resultado Acumulado: ${formatBRL(snapshot.totalProfitBrl)} (${formatPercent(snapshot.totalProfitPercent)})`,
    `Renda Passiva 12 Meses: ${formatBRL(snapshot.passiveIncome.last12MonthsBrl)} (YoC: ${formatPercent(snapshot.passiveIncome.portfolioYieldOnCostPercent)})`,
    `Reserva de Emergência: ${formatPercent(snapshot.emergencyReserve.reserveCompletionPercent)} concluída (${snapshot.emergencyReserve.reserveStatus})`,
    `Maiores Posições: ${topHoldings || 'Carteira vazia'}`
  ].join('\n');

  if (env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Você é o Consultor Private Digital da Norte Invest, especialista no Método DAVI & Hydra (foco em valor, renda passiva consistente, disciplina de rebalanceamento e blindagem de reserva).\nResponda em Português Brasileiro de forma executiva, elegante e objetiva (máximo 3 parágrafos curtos).\n\nContexto real da carteira:\n${portfolioBrief}\n\nPergunta do investidor: ${message}`;
      const result = await model.generateContent(prompt);
      const reply = result.response.text();
      if (reply) {
        return NextResponse.json({ reply });
      }
    } catch (err) {
      console.warn('⚠️ [Gemini Fallback Activated]:', err);
    }
  }

  // Diagnóstico determinístico local caso GEMINI_API_KEY não esteja definida
  const underweight = [...snapshot.categoryDistances].sort((a, b) => b.distance - a.distance)[0];
  const fallbackReply = `Analisando a carteira Private de **${ctx.portfolioOwner.name}**, seu patrimônio consolidado está em **${formatBRL(snapshot.totalEquityBrl)}**, com **${formatBRL(snapshot.passiveIncome.last12MonthsBrl)}** recebidos em proventos nos últimos 12 meses (Yield on Cost de **${formatPercent(snapshot.passiveIncome.portfolioYieldOnCostPercent)}**).\n\nPela régua do **Método DAVI & Hydra**, a classe atualmente mais descontada em relação à meta é **${underweight?.name || 'Renda Fixa'}** (distância de **${formatPercent(underweight?.distance || 0)}**), enquanto sua Reserva de Emergência encontra-se **${formatPercent(snapshot.emergencyReserve.reserveCompletionPercent)}** concluída. Utilize o simulador **Onde Aportar** para distribuir seu próximo aporte com precisão.`;

  return NextResponse.json({ reply: fallbackReply });
}
