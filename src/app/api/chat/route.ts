import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/env';
import { formatPercent } from '@/lib/money';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { buildPortfolioSnapshot } from '@/server/engines/portfolio.service';
import {
  PortfolioAiContext,
  generateLocalAiResponse,
  buildGeminiPrompt
} from '@/server/engines/mantfrai-ai.engine';

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

  const underweight = [...snapshot.categoryDistances].sort((a, b) => b.distance - a.distance)[0];

  const aiContext: PortfolioAiContext = {
    userName: ctx.portfolioOwner.name,
    totalEquityBrl: snapshot.totalEquityBrl,
    totalInvestedBrl: snapshot.totalInvestedBrl,
    totalProfitBrl: snapshot.totalProfitBrl,
    totalProfitPercent: snapshot.totalProfitPercent,
    last12MonthsIncomeBrl: snapshot.passiveIncome.last12MonthsBrl,
    yieldOnCostPercent: snapshot.passiveIncome.portfolioYieldOnCostPercent,
    emergencyReserveCompletedPercent: snapshot.emergencyReserve.reserveCompletionPercent,
    emergencyReserveStatus: snapshot.emergencyReserve.reserveStatus,
    underweightCategoryName: underweight?.name || 'Renda Fixa',
    underweightCategoryDistance: underweight?.distance || 0,
    topHoldings: topHoldings || 'Nenhum ativo cadastrado',
    usdToBrl: snapshot.usdToBrl,
    selicRate: snapshot.selicRate
  };

  if (env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = buildGeminiPrompt(message, aiContext);
      const result = await model.generateContent(prompt);
      const reply = result.response.text();
      if (reply) {
        return NextResponse.json({ reply });
      }
    } catch (err) {
      console.warn('⚠️ [Gemini Fallback Activated]:', err);
    }
  }

  // Motor determinístico local hiperespecializado (caso GEMINI_API_KEY não esteja configurada ou haja instabilidade de rede)
  const localReply = generateLocalAiResponse(message, aiContext);
  return NextResponse.json({ reply: localReply });
}
