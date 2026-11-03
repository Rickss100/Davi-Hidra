'use client';

import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Flame,
  Info,
  Layers,
  Sparkles,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { Badge, Button, Card, Select, Skeleton } from '@/components/ui/primitives';
import { useAnnualDividends } from '@/hooks/use-passive-income';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { AnnualMonthSummaryDTO } from '@/server/engines/passive-income.engine';

export function AnnualDividendHeatmap() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<AnnualMonthSummaryDTO | null>(null);

  const { data, isLoading } = useAnnualDividends(selectedYear);
  const heatmap = data?.heatmap;

  const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

  if (isLoading || !heatmap) {
    return (
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  const maxMonthValue = Math.max(1, ...heatmap.months.map((m) => m.totalBrl));

  return (
    <Card className="space-y-6">
      {/* 1. Topo do Mapa Anual + Seletor de Ano */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-white sm:text-2xl">
            <Flame className="h-6 w-6 text-amber-400" aria-hidden="true" />
            Mapa Anual de Proventos — Visão 12 Meses
          </h2>
          <p className="mt-1 text-xs text-slate-300 sm:text-sm">
            Distribuição temporal de dividendos ao longo do ano. Identifique meses de pico e garanta fluxo de renda constante.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Ano anterior"
            onClick={() => setSelectedYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            id="heatmap-year"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setSelectedMonth(null);
            }}
            className="w-32 font-bold text-white text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Ano {y}
              </option>
            ))}
          </Select>

          <Button
            variant="outline"
            size="icon"
            aria-label="Próximo ano"
            onClick={() => setSelectedYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Três Cards de Resumo Anual */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400">
            <span>Total em {selectedYear}</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="money-value text-2xl font-extrabold text-white">
            {formatBRL(heatmap.totalYearBrl)}
          </p>
          <p className="text-[11px] text-slate-300">
            Proventos consolidados no período
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-obsidian-950/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
            <span>Média Mensal</span>
            <TrendingUp className="h-4 w-4 text-sky-400" />
          </div>
          <p className="money-value text-2xl font-extrabold text-sky-300">
            {formatBRL(heatmap.monthlyAverageBrl)}
            <span className="text-xs font-normal text-slate-400 ml-1">/mês</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Renda média recorrente estimada
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-obsidian-950/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
            <span>Mês Campeão 🏆</span>
            <Trophy className="h-4 w-4 text-gold-400" />
          </div>
          <p className="money-value text-2xl font-extrabold text-gold-300">
            {heatmap.bestMonth ? `${heatmap.bestMonth.monthName} (${formatBRL(heatmap.bestMonth.totalBrl)})` : '—'}
          </p>
          <p className="text-[11px] text-slate-400">
            Pico de distribuições do ano
          </p>
        </div>
      </div>

      {/* 3. Grid dos 12 Meses (Mapa de Calor Visual) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Cronograma de Janeiro a Dezembro</span>
          <span className="text-slate-400 font-normal">Clique no card para ver detalhes dos ativos</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          {heatmap.months.map((m) => {
            const intensity = m.totalBrl > 0 ? Math.min(1, m.totalBrl / maxMonthValue) : 0;
            const isBest = heatmap.bestMonth?.month === m.month && m.totalBrl > 0;
            const isSelected = selectedMonth?.month === m.month;

            return (
              <button
                key={m.month}
                type="button"
                onClick={() => setSelectedMonth(isSelected ? null : m)}
                className={cn(
                  'relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:scale-[1.02] focus:outline-none',
                  isSelected
                    ? 'border-gold-400 bg-gold-500/15 shadow-lg shadow-gold-500/10'
                    : m.isCurrentMonth
                      ? 'border-emerald-400/80 bg-emerald-950/30'
                      : m.totalBrl > 0
                        ? 'border-slate-700/80 bg-obsidian-900/60 hover:border-slate-600'
                        : 'border-slate-800/60 bg-obsidian-950/40 opacity-70 hover:opacity-100'
                )}
              >
                {/* Badges do Mês */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-extrabold text-white">
                    {m.monthName}
                  </span>
                  {m.isCurrentMonth && (
                    <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] font-black text-emerald-300 uppercase">
                      Atual
                    </span>
                  )}
                  {isBest && !m.isCurrentMonth && (
                    <span className="text-xs" title="Mês com mais proventos">
                      🏆
                    </span>
                  )}
                </div>

                {/* Valor do Mês */}
                <div className="my-2.5">
                  <p
                    className={cn(
                      'money-value text-base sm:text-lg font-black truncate',
                      m.totalBrl > 0 ? 'text-emerald-400' : 'text-slate-500'
                    )}
                  >
                    {m.totalBrl > 0 ? formatBRL(m.totalBrl) : 'R$ 0,00'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {m.assets.length > 0 ? `${m.assets.length} ativo(s)` : 'Sem proventos'}
                  </p>
                </div>

                {/* Barra de Intensidade do Calor */}
                <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isBest ? 'bg-gold-400' : 'bg-emerald-400'
                    )}
                    style={{ width: `${Math.max(4, Math.round(intensity * 100))}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Detalhamento do Mês Selecionado */}
      {selectedMonth && (
        <div className="rounded-xl border border-slate-700 bg-obsidian-950/80 p-4 sm:p-5 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                Proventos Detalhados de {selectedMonth.monthName} de {selectedYear}
              </h3>
            </div>
            <span className="money-value text-sm sm:text-base font-extrabold text-emerald-400">
              Total: {formatBRL(selectedMonth.totalBrl)}
            </span>
          </div>

          {selectedMonth.assets.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              Nenhum provento recebido ou previsto para este mês.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-1">
              {selectedMonth.assets.map((asset) => (
                <div
                  key={asset.code}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-obsidian-900/60 p-2.5 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-white text-sm">{asset.code}</span>
                    <span className="block text-[11px] text-slate-400 truncate max-w-[150px]">
                      {asset.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="money-value font-extrabold text-emerald-400 text-sm">
                      {formatBRL(asset.totalBrl)}
                    </span>
                    <span className="block text-[9.5px] text-slate-500">
                      {asset.isEstimated ? 'Estimado (DY)' : 'Realizado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Dica Metodológica da MANTFRAI */}
      <div className="rounded-xl border border-slate-800/80 bg-obsidian-950/60 p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-gold-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-gold-300 font-bold">Dica da Metodologia (Aula 4.4 & 5.1):</strong> Fundos Imobiliários distribuem rendimentos mensalmente, enquanto empresas dos Setores Perenes (BEST) costumam pagar trimestral ou semestralmente. Uma carteira equilibrada garante que o investidor receba proventos consistentes em todos os 12 meses do ano.
        </span>
      </div>
    </Card>
  );
}
