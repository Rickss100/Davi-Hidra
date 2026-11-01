'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Target } from 'lucide-react';
import { Badge, Card } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import type { CategoryDistanceDTO } from '@/server/engines/davi-hydra.engine';

export function AllocationDiagnostic({ distances }: { distances: CategoryDistanceDTO[] }) {
  const hasTargets = distances.some((c) => c.targetPercent > 0);

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-white sm:text-xl">
            <Target className="h-6 w-6 text-gold-400" aria-hidden="true" />
            Diagnóstico de alocação — régua DAVI &amp; Hydra
          </h2>
          <p className="mt-1 text-sm text-slate-200 sm:text-base">
            Peso real de cada classe hoje comparado à meta que você definiu. A marca dourada indica a meta.
          </p>
        </div>
        <Link
          href="/onde-aportar"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gold-300 hover:underline sm:text-base"
        >
          Ver onde aportar <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {!hasTargets && (
        <p className="rounded-xl border border-gold-500/40 bg-gold-500/10 p-4 text-sm text-slate-100 sm:text-base">
          Você ainda não definiu metas por classe.{' '}
          <Link href="/definir-objetivos" className="font-bold text-gold-300 hover:underline">
            Defina seus objetivos
          </Link>{' '}
          para que o diagnóstico mostre quanto aportar em cada uma.
        </p>
      )}

      <ul className="grid gap-3">
        {distances.map((cat) => {
          const underweight = cat.distance > 0.5;
          return (
            <li key={cat.category} className="space-y-2.5 rounded-xl border border-slate-800 bg-obsidian-950/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">{cat.name}</h3>
                  <p className="money-value text-sm text-slate-300">Saldo atual: {formatBRL(cat.currentValueBrl)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-slate-200 sm:text-base">
                    Atual: <strong className="text-white">{formatPercent(cat.currentPercent)}</strong> / Meta:{' '}
                    <strong className="text-gold-300">{formatPercent(cat.targetPercent)}</strong>
                  </span>
                  <Badge tone={underweight ? 'gold' : 'emerald'}>
                    {underweight ? `Aportar (+${formatPercent(cat.distance)})` : 'Alocação em dia'}
                  </Badge>
                </div>
              </div>

              <div
                role="progressbar"
                aria-valuenow={Math.min(100, cat.currentPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${cat.name}: ${formatPercent(cat.currentPercent)} da carteira, meta ${formatPercent(cat.targetPercent)}`}
                className="relative h-3 w-full overflow-hidden rounded-full bg-obsidian-900"
              >
                <div
                  className="h-full rounded-full bg-emerald-500/80"
                  style={{ width: `${Math.min(100, cat.currentPercent)}%` }}
                />
                {cat.targetPercent > 0 && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-gold-400"
                    style={{ left: `${Math.min(100, cat.targetPercent)}%` }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
