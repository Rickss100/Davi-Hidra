'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Card } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import type { PortfolioSnapshotDTO } from '@/server/engines/portfolio.service';

const PALETTE = ['#D4AF37', '#10B981', '#38BDF8', '#A855F7', '#F97316', '#EC4899', '#64748B'];

export function HomeCharts({ snapshot }: { snapshot: PortfolioSnapshotDTO }) {
  const [pieMode, setPieMode] = useState<'class' | 'asset'>('class');
  const [incomePeriod, setIncomePeriod] = useState<'90d' | 'month' | '12m' | 'all'>('12m');

  const classData = snapshot.categoryDistances
    .filter((c) => c.currentValueBrl > 0)
    .map((c) => ({
      name: c.name,
      value: c.currentValueBrl,
      pct: c.currentPercent
    }));

  const assetData = snapshot.flatHoldings.slice(0, 8).map((h) => ({
    name: h.code,
    value: h.currentValueBrl,
    pct: h.portfolioWeightPercent
  }));

  const activePieData = pieMode === 'class' ? classData : assetData;

  const periodAmount =
    incomePeriod === '90d'
      ? snapshot.passiveIncome.last90DaysBrl
      : incomePeriod === 'month'
        ? snapshot.passiveIncome.currentMonthBrl
        : incomePeriod === '12m'
          ? snapshot.passiveIncome.last12MonthsBrl
          : snapshot.passiveIncome.allTimeBrl;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Rosca de Alocação Patrimonial */}
      <Card className="flex flex-col justify-between">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">Composição da Carteira</h2>
            <p className="text-xs text-slate-400">Inclui Renda Variável BR/EUA e Renda Fixa</p>
          </div>
          <div className="flex rounded-lg border border-slate-800 bg-obsidian-950 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setPieMode('class')}
              className={`rounded-md px-2.5 py-1 font-semibold ${
                pieMode === 'class' ? 'bg-gold-500 text-obsidian-950' : 'text-slate-400'
              }`}
            >
              Por Classe
            </button>
            <button
              type="button"
              onClick={() => setPieMode('asset')}
              className={`rounded-md px-2.5 py-1 font-semibold ${
                pieMode === 'asset' ? 'bg-gold-500 text-obsidian-950' : 'text-slate-400'
              }`}
            >
              Por Ativo
            </button>
          </div>
        </div>

        {activePieData.length === 0 ? (
          <div className="flex h-60 items-center justify-center text-xs text-slate-500">
            Nenhum ativo em custódia ainda. Importe sua planilha B3 ou lance um aporte.
          </div>
        ) : (
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activePieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {activePieData.map((entry, index) => (
                      <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => formatBRL(val)}
                    contentStyle={{
                      backgroundColor: '#0B101B',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 text-xs">
              {activePieData.map((item, idx) => (
                <li key={item.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                    />
                    {item.name}
                  </span>
                  <span className="money-value font-semibold text-white">
                    {formatPercent(item.pct)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Gráfico Real de Proventos B3 */}
      <Card className="flex flex-col justify-between">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">Renda Passiva Real (Proventos B3)</h2>
            <p className="money-value text-sm font-bold text-emerald-400">
              {formatBRL(periodAmount)}{' '}
              <span className="text-xs font-normal text-slate-400">no período selecionado</span>
            </p>
          </div>
          <div className="flex rounded-lg border border-slate-800 bg-obsidian-950 p-0.5 text-[11px]">
            {[
              { id: '90d', label: '90d B3' },
              { id: 'month', label: 'Mês' },
              { id: '12m', label: '12M' },
              { id: 'all', label: 'Total' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIncomePeriod(p.id as '90d' | 'month' | '12m' | 'all')}
                className={`rounded-md px-2 py-1 font-semibold ${
                  incomePeriod === p.id ? 'bg-emerald-500 text-obsidian-950' : 'text-slate-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {snapshot.passiveIncome.monthlySeries.length === 0 ? (
          <div className="flex h-60 items-center justify-center text-xs text-slate-500">
            Importe suas planilhas anuais da B3 para visualizar o histórico mensal de dividendos.
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snapshot.passiveIncome.monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  formatter={(val: number) => [formatBRL(val), 'Proventos']}
                  contentStyle={{
                    backgroundColor: '#0B101B',
                    borderColor: '#1E293B',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="totalBrl" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
