'use client';

import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Globe, PieChart as PieIcon } from 'lucide-react';
import { Card } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { AllocationBreakdownDTO, AllocationClassDTO } from '@/server/engines/allocation.engine';

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: AllocationClassDTO }> }) {
  const item = active ? payload?.[0]?.payload : undefined;
  if (!item) return null;
  return (
    <div className="rounded-lg border bg-obsidian-900 p-3 shadow-xl" style={{ borderColor: item.color }}>
      <p className="text-sm font-bold" style={{ color: item.color }}>
        {item.name}
      </p>
      <p className="money-value text-sm text-white">
        {formatBRL(item.currentBrl)} ({formatPercent(item.sharePercent, 1)})
      </p>
    </div>
  );
}

const signed = (v: number) => `${v > 0 ? '+' : ''}${formatPercent(v)}`;

export function AllocationBreakdown({ allocation }: { allocation: AllocationBreakdownDTO }) {
  const { classes, geography } = allocation;

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-white sm:text-xl">
          <PieIcon className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          Composição e desempenho por classe de ativo
        </h2>
        <p className="mt-1 text-sm text-slate-200 sm:text-base">
          Distribuição da carteira entre as classes e exposição internacional.
        </p>
      </div>

      {classes.length === 0 ? (
        <p className="rounded-xl border border-slate-700/80 bg-obsidian-950/60 p-8 text-center text-sm text-slate-300 sm:text-base">
          Registre seus primeiros ativos na Carteira para ver a composição.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <div className="h-[240px]" role="img" aria-label="Gráfico de rosca da composição da carteira por classe">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classes}
                    dataKey="currentBrl"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {classes.map((c) => (
                      <Cell key={c.key} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-800 bg-obsidian-950/60 p-4 text-sm sm:text-base">
              <p className="flex items-center gap-2 font-bold text-white">
                <Globe className="h-4 w-4 text-sky-300" aria-hidden="true" /> Exposição geográfica
              </p>
              <div className="flex justify-between text-slate-200">
                <span>🇧🇷 Brasil</span>
                <strong className="text-white">{formatPercent(geography.brasilPercent, 1)}</strong>
              </div>
              <div className="flex justify-between text-slate-200">
                <span>🇺🇸 Exterior (USD)</span>
                <strong className="text-sky-300">{formatPercent(geography.exteriorPercent, 1)}</strong>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[640px] text-left text-sm sm:text-base">
              <caption className="sr-only">Desempenho por classe de ativo</caption>
              <thead className="bg-obsidian-800/70 text-xs uppercase text-slate-300 sm:text-sm">
                <tr>
                  <th scope="col" className="px-3 py-3">Classe de ativo</th>
                  <th scope="col" className="px-3 py-3 text-right">Aplicado</th>
                  <th scope="col" className="px-3 py-3 text-right">Atual</th>
                  <th scope="col" className="px-3 py-3 text-right">Lucro / Prej.</th>
                  <th scope="col" className="px-3 py-3 text-right">Rentab.</th>
                  <th scope="col" className="px-3 py-3 text-right">Partic.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {classes.map((c) => (
                  <tr key={c.key} className="hover:bg-obsidian-800/40">
                    <th scope="row" className="px-3 py-3 font-semibold text-white">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                        {c.name}
                      </span>
                    </th>
                    <td className="money-value px-3 py-3 text-right text-slate-200">{formatBRL(c.investedBrl)}</td>
                    <td className="money-value px-3 py-3 text-right font-semibold text-white">{formatBRL(c.currentBrl)}</td>
                    <td
                      className={cn(
                        'money-value px-3 py-3 text-right font-semibold',
                        c.profitBrl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      )}
                    >
                      {c.profitBrl > 0 ? '+' : ''}
                      {formatBRL(c.profitBrl)}
                    </td>
                    <td
                      className={cn(
                        'money-value px-3 py-3 text-right font-semibold',
                        c.returnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      )}
                    >
                      {signed(c.returnPercent)}
                    </td>
                    <td className="money-value px-3 py-3 text-right font-semibold text-white">
                      {formatPercent(c.sharePercent, 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
