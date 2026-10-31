'use client';

import React from 'react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Card, Badge, Skeleton } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';

export default function ResumoPage() {
  const { data, isLoading } = usePortfolioData();

  if (isLoading || !data) {
    return <Skeleton className="h-96" />;
  }

  const { snapshot } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Resumo & Diagnóstico de Alocação</h1>
        <p className="text-xs text-slate-400">
          Comparativo direto entre o peso real de cada classe hoje e a meta definida na sua régua DAVI & Hydra.
        </p>
      </div>

      <div className="grid gap-4">
        {snapshot.categoryDistances.map((cat) => {
          const isUnderweight = cat.distance > 0.5;
          return (
            <Card key={cat.category} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white">{cat.name}</h2>
                  <p className="money-value text-xs text-slate-400">
                    Saldo atual: {formatBRL(cat.currentValueBrl)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="money-value text-xs text-slate-300">
                    Atual: <strong>{formatPercent(cat.currentPercent)}</strong> / Meta:{' '}
                    <strong>{formatPercent(cat.targetPercent)}</strong>
                  </span>
                  <Badge tone={isUnderweight ? 'gold' : 'emerald'}>
                    {isUnderweight
                      ? `Aportar (+${formatPercent(cat.distance)})`
                      : 'Alocação em Dia'}
                  </Badge>
                </div>
              </div>

              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-obsidian-950">
                <div
                  className="h-full rounded-full bg-gold-500"
                  style={{ width: `${Math.min(100, cat.currentPercent)}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
