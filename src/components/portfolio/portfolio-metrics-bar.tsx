'use client';

import React from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Coins,
  TrendingUp,
  TrendingDown,
  Gift,
  Target,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Card, Badge } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { PortfolioSnapshotDTO } from '@/server/engines/portfolio.service';

interface PortfolioMetricsBarProps {
  snapshot: PortfolioSnapshotDTO;
}

const CLASS_COLORS: Record<string, { bar: string; badge: 'emerald' | 'gold' | 'sky' | 'purple' | 'slate' }> = {
  acoes: { bar: 'bg-emerald-500', badge: 'emerald' },
  fiis: { bar: 'bg-gold-500', badge: 'gold' },
  fixed: { bar: 'bg-sky-500', badge: 'sky' },
  stocks: { bar: 'bg-purple-500', badge: 'purple' },
  reits: { bar: 'bg-indigo-500', badge: 'purple' }
};

export function PortfolioMetricsBar({ snapshot }: PortfolioMetricsBarProps) {
  const isProfit = snapshot.totalProfitBrl >= 0;
  const distances = snapshot.categoryDistances || [];

  // Encontra a classe mais defasada (onde o aporte é mais necessário segundo o Método Hydra)
  const mostUnderweight = [...distances].sort((a, b) => b.distance - a.distance)[0];

  return (
    <div className="space-y-4">
      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Patrimônio Total */}
        <Card className="border border-slate-800 bg-obsidian-950/80 p-4 transition-all hover:border-slate-700 sm:p-5">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span>Patrimônio Total</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="money-value mt-2 text-xl font-black text-white sm:text-2xl lg:text-3xl">
            {formatBRL(snapshot.totalEquityBrl)}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            Posição consolidada a mercado
          </div>
        </Card>

        {/* Card 2: Total Investido (Aplicado) */}
        <Card className="border border-slate-800 bg-obsidian-950/80 p-4 transition-all hover:border-slate-700 sm:p-5">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span>Capital Aplicado</span>
            <Coins className="h-4 w-4 text-sky-400" />
          </div>
          <div className="money-value mt-2 text-xl font-black text-slate-200 sm:text-2xl lg:text-3xl">
            {formatBRL(snapshot.totalInvestedBrl)}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            Total aportado de compras
          </div>
        </Card>

        {/* Card 3: Lucro / Prejuízo */}
        <Card className="border border-slate-800 bg-obsidian-950/80 p-4 transition-all hover:border-slate-700 sm:p-5">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span>Retorno Total</span>
            {isProfit ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-400" />
            )}
          </div>
          <div
            className={cn(
              'money-value mt-2 text-xl font-black sm:text-2xl lg:text-3xl',
              isProfit ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {isProfit ? '+' : ''}
            {formatBRL(snapshot.totalProfitBrl)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium">
            <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
              {isProfit ? '+' : ''}
              {formatPercent(snapshot.totalProfitPercent)}
            </span>
            <span className="text-slate-400">de rentabilidade</span>
          </div>
        </Card>

        {/* Card 4: Proventos Totais */}
        <Card className="border border-slate-800 bg-obsidian-950/80 p-4 transition-all hover:border-slate-700 sm:p-5">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span>Proventos Acumulados</span>
            <Gift className="h-4 w-4 text-gold-400" />
          </div>
          <div className="money-value mt-2 text-xl font-black text-gold-400 sm:text-2xl lg:text-3xl">
            {formatBRL(snapshot.passiveIncome.allTimeBrl)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium">
            <span className="text-gold-400">
              YoC {formatPercent(snapshot.passiveIncome.portfolioYieldOnCostPercent)}
            </span>
            <span className="text-slate-400">sobre o custo</span>
          </div>
        </Card>
      </div>

      {/* Alocação Real vs Meta Hydra por Classe */}
      {distances.length > 0 && (
        <Card className="border border-slate-800 bg-obsidian-950/90 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gold-400" />
              <h2 className="text-sm font-bold text-white sm:text-base">
                Alocação Real vs. Meta MANTFRAI
              </h2>
            </div>

            {mostUnderweight && mostUnderweight.distance > 0 && (
              <Link
                href="/onde-aportar"
                className="flex items-center gap-1 text-xs font-semibold text-gold-400 hover:text-gold-300 hover:underline"
              >
                <span>Aporte sugerido em {mostUnderweight.name}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {distances.map((dist) => {
              const theme = CLASS_COLORS[dist.category] || { bar: 'bg-slate-500', badge: 'slate' };
              const currentPct = dist.currentPercent;
              const targetPct = dist.targetPercent;
              const diffPp = dist.distance;

              return (
                <div
                  key={dist.category}
                  className="rounded-xl border border-slate-800/80 bg-obsidian-900/60 p-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{dist.name}</span>
                    <Badge tone={theme.badge} className="text-[10px] px-1.5 py-0.2">
                      Meta {formatPercent(targetPct, 0)}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-sm font-extrabold text-slate-200">
                      {formatPercent(currentPct, 1)}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold',
                        diffPp > 0 ? 'text-gold-400' : 'text-slate-400'
                      )}
                    >
                      {diffPp > 0
                        ? `Defasado (-${formatPercent(diffPp, 1)})`
                        : diffPp < -1
                          ? `Excedente (+${formatPercent(Math.abs(diffPp), 1)})`
                          : 'Equilibrado'}
                    </span>
                  </div>

                  {/* Barra de Progresso Real vs Meta */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', theme.bar)}
                      style={{
                        width: `${Math.min(100, targetPct > 0 ? (currentPct / targetPct) * 100 : 0)}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
