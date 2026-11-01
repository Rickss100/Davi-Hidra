'use client';

import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/primitives';
import { formatBRL } from '@/lib/money';
import type { EvolutionPointDTO } from '@/server/engines/resumo.service';

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
}

function EvolutionTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[220px] rounded-lg border border-slate-700 bg-obsidian-900 p-3 shadow-xl">
      <p className="mb-1.5 text-sm font-bold text-white">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex justify-between gap-4 text-sm">
          <span style={{ color: item.color }} className="font-semibold">
            {item.name}:
          </span>
          <span className="money-value font-bold text-white">{formatBRL(item.value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

const axisMoney = (v: number) => (v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`);

export function CapitalEvolutionChart({ evolution }: { evolution: EvolutionPointDTO[] }) {
  // Mapeia estritamente os meses reais de transações
  const data = evolution.map((p, index) => {
    const isLast = index === evolution.length - 1;
    return {
      name: p.label,
      'Capital Aplicado': p.investedBrl,
      // Patrimônio a mercado destacado no ponto mais recente (como na V1)
      'Patrimônio Atual': isLast || evolution.length === 1 ? p.equityBrl : (p.equityBrl > 0 ? p.equityBrl : null)
    };
  });

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold uppercase tracking-wide text-white sm:text-xl">
          Evolução do Capital Aplicado (R$)
        </h2>
        <p className="mt-1 text-sm text-slate-200 sm:text-base">
          Acompanhe o crescimento histórico dos seus aportes ao longo do tempo.
        </p>
      </div>

      {data.length === 0 ? (
        <p className="rounded-xl border border-slate-700/80 bg-obsidian-950/60 p-8 text-center text-sm text-slate-300 sm:text-base">
          Sem dados de transações para exibir evolução patrimonial.
        </p>
      ) : (
        <div className="h-[320px] w-full" role="img" aria-label="Gráfico de evolução do capital aplicado e patrimônio a mercado">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8257e5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8257e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#04d361" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#04d361" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#cbd5e1', fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={axisMoney}
                width={72}
              />
              <Tooltip content={<EvolutionTooltip />} />
              <Area
                type="monotone"
                dataKey="Capital Aplicado"
                stroke="#8257e5"
                strokeWidth={2}
                fill="url(#colorCapital)"
                activeDot={{ r: 6, fill: '#8257e5', stroke: '#18181b', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="Patrimônio Atual"
                stroke="#04d361"
                strokeWidth={3}
                fill="url(#colorPatrimonio)"
                connectNulls={true}
                activeDot={{ r: 6, fill: '#04d361', stroke: '#18181b', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-200" aria-label="Legenda">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#8257e5]" aria-hidden="true" /> Capital aplicado (custo)
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#04d361]" aria-hidden="true" /> Patrimônio a mercado
        </li>
      </ul>
    </Card>
  );
}
