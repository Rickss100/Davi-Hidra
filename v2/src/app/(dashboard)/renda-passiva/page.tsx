'use client';

import React from 'react';
import { Coins, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Card, Badge, Skeleton } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';

export default function RendaPassivaPage() {
  const { data, isLoading } = usePortfolioData();

  if (isLoading || !data) {
    return <Skeleton className="h-96" />;
  }

  const { snapshot } = data;
  const { passiveIncome, magicNumbers } = snapshot;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Renda Passiva & Magic Number</h1>
        <p className="text-xs text-slate-400">
          Acompanhamento de dividendos, JCP, rendimentos de FIIs e efeito Bola de Neve.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-500/25">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Média Mensal (12M)</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="money-value mt-2 text-2xl font-extrabold text-emerald-400">
            {formatBRL(passiveIncome.monthlyAverage12mBrl)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Renda passiva recorrente</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Acumulado 12 Meses</span>
            <Calendar className="h-4 w-4 text-gold-400" />
          </div>
          <p className="money-value mt-2 text-2xl font-extrabold text-white">
            {formatBRL(passiveIncome.last12MonthsBrl)}
          </p>
          <p className="money-value mt-1 text-xs text-slate-400">
            Últimos 90 dias B3: {formatBRL(passiveIncome.last90DaysBrl)}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Yield on Cost (YoC)</span>
            <TrendingUp className="h-4 w-4 text-gold-400" />
          </div>
          <p className="money-value mt-2 text-2xl font-extrabold text-gold-400">
            {formatPercent(passiveIncome.portfolioYieldOnCostPercent)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Retorno anualizado sobre seu custo</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Histórico Recebido</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <p className="money-value mt-2 text-2xl font-extrabold text-white">
            {formatBRL(passiveIncome.allTimeBrl)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Desde o primeiro aporte</p>
        </Card>
      </div>

      {/* Tabela Magic Number */}
      <Card>
        <div className="mb-4">
          <h2 className="text-base font-bold text-white">
            Tabela Magic Number (Efeito Bola de Neve)
          </h2>
          <p className="text-xs text-slate-400">
            Quantas cotas você precisa acumular para que os próprios proventos mensais comprem +1 nova cota automaticamente.
          </p>
        </div>

        {magicNumbers.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">
            Adicione FIIs ou Ações pagadoras de dividendos para calcular seu Magic Number.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">Ativo</th>
                  <th className="pb-3 text-right font-semibold">Cotas Atuais</th>
                  <th className="pb-3 text-right font-semibold">Meta Magic Number</th>
                  <th className="pb-3 text-right font-semibold">Faltam</th>
                  <th className="pb-3 text-right font-semibold">Investimento Restante</th>
                  <th className="pb-3 text-right font-semibold">Progresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {magicNumbers.map((row) => (
                  <tr key={row.code} className="hover:bg-obsidian-800/40">
                    <td className="py-3 font-bold text-white">{row.code}</td>
                    <td className="money-value py-3 text-right text-slate-200">
                      {row.currentShares}
                    </td>
                    <td className="money-value py-3 text-right font-semibold text-gold-300">
                      {row.magicNumberShares} cotas
                    </td>
                    <td className="money-value py-3 text-right text-slate-300">
                      {row.missingShares} cotas
                    </td>
                    <td className="money-value py-3 text-right text-slate-300">
                      {formatBRL(row.investmentNeededBrl)}
                    </td>
                    <td className="py-3 text-right">
                      <Badge tone={row.progressPercent >= 100 ? 'emerald' : 'gold'}>
                        {formatPercent(row.progressPercent, 1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
