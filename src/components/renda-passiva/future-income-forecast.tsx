'use client';

import React, { useState } from 'react';
import { Snowflake, TrendingUp } from 'lucide-react';
import { Card, Input } from '@/components/ui/primitives';
import { useIncomeForecast } from '@/hooks/use-passive-income';
import { formatBRL, formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: '1 Ano', months: 12 },
  { label: '3 Anos', months: 36 },
  { label: '5 Anos', months: 60 },
  { label: '10 Anos', months: 120 }
] as const;

interface FutureIncomeForecastProps {
  currentEquityBrl: number;
  suggestedYieldPercent: number;
}

export function FutureIncomeForecast({ currentEquityBrl, suggestedYieldPercent }: FutureIncomeForecastProps) {
  const [months, setMonths] = useState(36);
  const [contribution, setContribution] = useState(1500);
  const [dyPercent, setDyPercent] = useState(suggestedYieldPercent > 0 ? suggestedYieldPercent : 8);
  const [reinvest, setReinvest] = useState(true);

  const { data, isFetching } = useIncomeForecast({
    months,
    monthlyContributionBrl: contribution,
    dividendYieldPercent: dyPercent,
    reinvest
  });
  const forecast = data?.forecast;

  const target = new Date();
  target.setMonth(target.getMonth() + months);
  const futureLabel = target.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const coverage = forecast?.coveragePercent ?? 0;

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-white sm:text-2xl">
          <TrendingUp className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          Previsão de Renda Passiva Futura &amp; Orçamento
        </h2>
        <p className="mt-1 text-sm text-slate-200 sm:text-base">
          Simule o poder dos juros compostos e do Efeito Bola de Neve na data futura de sua escolha.
        </p>
      </div>

      {currentEquityBrl === 0 && (
        <p className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 text-sm text-sky-100 sm:text-base">
          🌱 <strong>Iniciando do zero (patrimônio R$ 0,00):</strong> a projeção parte apenas do seu aporte mensal e do
          reinvestimento dos proventos.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-700/80 bg-obsidian-950/60 p-5">
          <div className="flex items-center justify-between rounded-lg bg-obsidian-800/60 px-3 py-2.5 text-sm text-slate-200">
            <span>Patrimônio atual em carteira:</span>
            <strong className="money-value text-base text-emerald-400">{formatBRL(currentEquityBrl)}</strong>
          </div>

          <div className="space-y-2">
            <label htmlFor="forecast-months" className="block text-sm font-bold text-slate-100">
              Horizonte de tempo: {months} meses ({(months / 12).toFixed(1)} anos)
            </label>
            <input
              id="forecast-months"
              type="range"
              min={6}
              max={240}
              step={6}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full cursor-pointer accent-emerald-500"
            />
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.months}
                  type="button"
                  onClick={() => setMonths(p.months)}
                  aria-pressed={months === p.months}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-sm font-bold transition',
                    months === p.months
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : 'border-slate-700 bg-obsidian-900 text-slate-200 hover:border-gold-500/50'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="forecast-contribution" className="block text-sm font-bold text-slate-100">
              Aporte mensal pretendido (R$)
            </label>
            <Input
              id="forecast-contribution"
              type="number"
              min={0}
              step={100}
              value={contribution}
              onChange={(e) => setContribution(Math.max(0, Number(e.target.value) || 0))}
              className="text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="forecast-dy" className="block text-sm font-bold text-slate-100">
              Dividend Yield médio da carteira (% a.a.)
            </label>
            <Input
              id="forecast-dy"
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={dyPercent}
              onChange={(e) => setDyPercent(Math.min(30, Math.max(0, Number(e.target.value) || 0)))}
              className="text-base"
            />
            <p className="text-xs text-slate-300">
              {suggestedYieldPercent > 0
                ? `Seu DY atual medido é ${formatPercent(suggestedYieldPercent, 1)} a.a.`
                : 'Sem proventos medidos ainda: valor ilustrativo, ajuste conforme sua estratégia.'}
            </p>
          </div>

          <label htmlFor="forecast-reinvest" className="flex cursor-pointer items-start gap-3 text-sm text-slate-100 sm:text-base">
            <input
              id="forecast-reinvest"
              type="checkbox"
              checked={reinvest}
              onChange={(e) => setReinvest(e.target.checked)}
              className="mt-1 h-5 w-5 accent-emerald-500"
            />
            <span>
              <strong>Efeito Bola de Neve:</strong> reinvestir 100% dos proventos recebidos
            </span>
          </label>
        </div>

        <div className={cn('space-y-4 rounded-xl border border-slate-700/80 bg-obsidian-950/60 p-5', isFetching && 'opacity-70')}>
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/25 p-5 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-200">
              Renda passiva mensal prevista em {futureLabel}
            </p>
            <p className="money-value mt-1 text-4xl font-extrabold text-emerald-400">
              {formatBRL(forecast?.finalMonthlyIncomeBrl ?? 0)}
              <span className="ml-1 text-lg font-semibold text-slate-300">/mês</span>
            </p>
            <p className="text-sm text-slate-200">Ou {formatBRL(forecast?.finalAnnualIncomeBrl ?? 0)} por ano</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-700/80 p-3 text-center">
              <p className="text-xs font-bold uppercase text-slate-300">Patrimônio acumulado</p>
              <p className="money-value text-xl font-extrabold text-emerald-400">{formatBRL(forecast?.finalEquityBrl ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-700/80 p-3 text-center">
              <p className="text-xs font-bold uppercase text-slate-300">Proventos no período</p>
              <p className="money-value text-xl font-extrabold text-sky-400">{formatBRL(forecast?.totalDividendsBrl ?? 0)}</p>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            Do seu bolso: {formatBRL(forecast?.totalContributedBrl ?? 0)} em aportes ao longo de {months} meses.
          </p>

          <div className="space-y-2 rounded-xl border border-slate-700/80 p-4">
            <div className="flex items-center justify-between text-sm font-bold text-slate-100 sm:text-base">
              <span>Cobertura do custo de vida ({formatBRL(forecast?.monthlyExpenseBrl ?? 0)}/mês):</span>
              <strong className={coverage >= 100 ? 'text-emerald-400' : 'text-gold-400'}>{formatPercent(coverage, 1)}</strong>
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.min(100, coverage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Cobertura do custo de vida"
              className="h-3 overflow-hidden rounded-full bg-obsidian-800"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-emerald-400"
                style={{ width: `${Math.min(100, coverage)}%` }}
              />
            </div>
            <p className="text-sm text-slate-200">
              {coverage >= 100 ? (
                <>🎉 <strong>Independência financeira atingida!</strong> Seus dividendos cobrem 100% das contas básicas.</>
              ) : (
                <>🛡️ Em {futureLabel}, seus rendimentos cobrirão <strong>{Math.round(coverage)}%</strong> do orçamento, pagando contas como luz, água e supermercado.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {forecast && forecast.timeline.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
            <Snowflake className="h-5 w-5 text-sky-300" aria-hidden="true" />
            Evolução projetada (Efeito Bola de Neve ao longo dos anos)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[640px] text-left text-sm sm:text-base">
              <caption className="sr-only">Evolução projetada do patrimônio e da renda passiva</caption>
              <thead className="bg-obsidian-800/70 text-xs uppercase text-slate-300 sm:text-sm">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Prazo</th>
                  <th scope="col" className="px-3 py-2.5">Mês</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Patrimônio total</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Renda / mês</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Renda anual</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Cobertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {forecast.timeline.map((row) => (
                  <tr key={row.month} className="hover:bg-obsidian-800/40">
                    <td className="px-3 py-2.5 font-bold text-white">{row.years} ano(s)</td>
                    <td className="px-3 py-2.5 text-slate-200">Mês {row.month}</td>
                    <td className="money-value px-3 py-2.5 text-right font-semibold text-emerald-400">{formatBRL(row.equityBrl)}</td>
                    <td className="money-value px-3 py-2.5 text-right font-semibold text-sky-400">{formatBRL(row.monthlyIncomeBrl)}</td>
                    <td className="money-value px-3 py-2.5 text-right text-slate-200">{formatBRL(row.annualIncomeBrl)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gold-300">{formatPercent(row.coveragePercent, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-300 sm:text-sm">
        Projeção educacional com valorização de 4% a.a. e DY constante. Rentabilidade passada não garante resultados
        futuros; não constitui recomendação de investimento (CVM 19/2021).
      </p>
    </Card>
  );
}
