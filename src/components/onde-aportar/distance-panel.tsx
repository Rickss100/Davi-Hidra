'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Target } from 'lucide-react';
import { Card } from '@/components/ui/primitives';
import { formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type {
  AssetDistanceBreakdownDTO,
  CategoryDistanceDTO,
  PortfolioCategoryKey
} from '@/server/engines/davi-hydra.engine';

interface DistancePanelProps {
  categoryDistances: CategoryDistanceDTO[];
  assetDistancesByCategory: Record<PortfolioCategoryKey, AssetDistanceBreakdownDTO[]>;
  onOpenHelp: () => void;
}

export function DistancePanel({
  categoryDistances,
  assetDistancesByCategory,
  onOpenHelp
}: DistancePanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<PortfolioCategoryKey | null>(null);

  const toggleCategory = (cat: PortfolioCategoryKey) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-500/40 bg-gold-500/15 text-gold-300">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white sm:text-lg">
              Distância para o objetivo
            </h2>
            <p className="text-xs text-slate-300 sm:text-sm">
              Clique na classe para abrir cada ativo da meta
            </p>
          </div>
        </div>

        <button
          type="button"
          title="Como funciona a régua de distância?"
          aria-label="Como funciona a régua de distância"
          onClick={onOpenHelp}
          className="rounded-lg p-2 text-slate-300 transition hover:bg-obsidian-800 hover:text-gold-300"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-obsidian-950 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-slate-300">
        <span>Classe / Ativo</span>
        <span>Falta p/ Meta (+)</span>
      </div>

      <div className="space-y-3">
        {categoryDistances.map((catDist) => {
          const isExpanded = expandedCategory === catDist.category;
          const needsAporte = catDist.distance > 0.05;
          const isOverweight = catDist.distance < -0.05;
          const fillRatio =
            catDist.targetPercent > 0
              ? Math.min(100, Math.round((catDist.currentPercent / catDist.targetPercent) * 100))
              : catDist.currentPercent > 0
                ? 100
                : 0;
          const categoryAssets = assetDistancesByCategory?.[catDist.category] || [];

          return (
            <div
              key={catDist.category}
              className="overflow-hidden rounded-xl border border-slate-700/80 bg-obsidian-950/95"
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggleCategory(catDist.category)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-obsidian-800/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-extrabold text-white sm:text-base">
                      {catDist.name}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-slate-300 transition-transform',
                        isExpanded && 'rotate-180 text-gold-400'
                      )}
                    />
                  </div>
                  <span className="money-value mt-1 block text-xs font-medium text-slate-300">
                    Atual {formatPercent(catDist.currentPercent)} · Meta{' '}
                    {formatPercent(catDist.targetPercent)}
                  </span>
                </div>

                <div className="w-32 shrink-0 text-right">
                  <span
                    className={cn(
                      'money-value text-sm font-extrabold sm:text-base',
                      needsAporte
                        ? 'text-emerald-400'
                        : isOverweight
                          ? 'text-rose-400'
                          : 'text-slate-200'
                    )}
                  >
                    {catDist.distance > 0 ? '+' : ''}
                    {formatPercent(catDist.distance)}
                  </span>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        needsAporte
                          ? 'bg-emerald-400'
                          : isOverweight
                            ? 'bg-rose-400'
                            : 'bg-gold-400'
                      )}
                      style={{ width: `${fillRatio}%` }}
                    />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 bg-obsidian-900/80 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                    <span>Ativo da Classe</span>
                    <span>Distância do Obj.</span>
                  </div>

                  {categoryAssets.length === 0 ? (
                    <p className="py-2 text-sm text-slate-300">
                      Nenhum ativo configurado nesta classe.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-800/70">
                      {categoryAssets.map((asset) => {
                        const assetNeeds = asset.distance > 0.05;
                        const assetOver = asset.distance < -0.05;
                        const assetFill =
                          asset.targetPercent > 0
                            ? Math.min(
                                100,
                                Math.round((asset.currentPercent / asset.targetPercent) * 100)
                              )
                            : asset.currentPercent > 0
                              ? 100
                              : 0;
                        const showSubName =
                          asset.name && asset.name.toUpperCase() !== asset.ticker.toUpperCase();

                        return (
                          <div
                            key={asset.ticker}
                            className="flex items-center justify-between gap-3 py-2.5 text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold text-white sm:text-base">
                                  {asset.ticker}
                                </span>
                                {!asset.inObjective && (
                                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                                    Fora da meta
                                  </span>
                                )}
                              </div>
                              {showSubName && (
                                <span className="mt-0.5 block truncate text-xs font-medium text-slate-200">
                                  {asset.name}
                                </span>
                              )}
                              <span className="money-value mt-0.5 block text-xs text-slate-300">
                                Atual {formatPercent(asset.currentPercent)} · Meta{' '}
                                {formatPercent(asset.targetPercent)}
                              </span>
                            </div>

                            <div className="w-28 shrink-0 text-right">
                              <span
                                className={cn(
                                  'money-value text-sm font-extrabold',
                                  assetNeeds
                                    ? 'text-emerald-400'
                                    : assetOver
                                      ? 'text-rose-400'
                                      : 'text-slate-200'
                                )}
                              >
                                {asset.distance > 0 ? '+' : ''}
                                {formatPercent(asset.distance)}
                              </span>
                              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    assetNeeds
                                      ? 'bg-emerald-400'
                                      : assetOver
                                        ? 'bg-rose-400'
                                        : 'bg-gold-400'
                                  )}
                                  style={{ width: `${assetFill}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-700/80 bg-obsidian-950 p-3.5 text-xs leading-relaxed text-slate-200 sm:text-sm">
        <strong className="text-emerald-400">Verde (+):</strong> classe ou ativo abaixo da meta
        (prioridade de aporte).{' '}
        <strong className="text-rose-400">Vermelho (-):</strong> acima da meta (aguardar).
      </div>
    </Card>
  );
}
