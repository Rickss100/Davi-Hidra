'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Star } from 'lucide-react';
import { Card, Input, Badge, Skeleton } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';

interface RadarItem {
  code: string;
  name: string;
  type: string;
  market: string;
  sector: string | null;
  price: number;
  peRatio: number | null;
  pbRatio: number | null;
  pVpa: number | null;
  dividendYield: number | null;
  roe: number | null;
  vacancyRate: number | null;
  rateDescription: string | null;
  userRating: number | null;
}

export default function RadarAtivosPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery<{ totalCatalog: number; items: RadarItem[] }>({
    queryKey: ['radar-assets', typeFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ type: typeFilter, q: search });
      const res = await fetch(`/api/radar?${params.toString()}`);
      return res.json();
    }
  });

  const handleRate = async (assetCode: string, rating: number) => {
    await fetch('/api/radar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetCode, rating })
    });
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Radar Fundamentalista de Ativos</h1>
          <p className="text-xs text-slate-400">
            Base institucional com {data?.totalCatalog ?? 1524} ativos monitorados (B3, Tesouro/RF e S&P 500 / REITs).
          </p>
        </div>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <label htmlFor="radar-search" className="sr-only">
            Buscar ativo por código ou setor
          </label>
          <Input
            id="radar-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ticker, empresa ou setor..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'acao', label: 'Ações BR' },
            { id: 'fii', label: 'FIIs' },
            { id: 'fixed', label: 'Renda Fixa' },
            { id: 'stock', label: 'Stocks EUA' },
            { id: 'reit', label: 'REITs EUA' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                typeFilter === t.id
                  ? 'bg-gold-500 text-obsidian-950'
                  : 'bg-obsidian-950 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {isLoading || !data ? (
        <Skeleton className="h-96" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">Código</th>
                  <th className="pb-3 font-semibold">Classe</th>
                  <th className="pb-3 font-semibold">Setor / Indexador</th>
                  <th className="pb-3 text-right font-semibold">Cotação</th>
                  <th className="pb-3 text-right font-semibold">P/L</th>
                  <th className="pb-3 text-right font-semibold">P/VP</th>
                  <th className="pb-3 text-right font-semibold">DY %</th>
                  <th className="pb-3 text-right font-semibold">ROE %</th>
                  <th className="pb-3 text-right font-semibold">Sua Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.items.map((item) => (
                  <tr key={item.code} className="hover:bg-obsidian-800/40">
                    <td className="py-2.5 font-bold text-white">{item.code}</td>
                    <td className="py-2.5">
                      <Badge tone="slate">{item.type}</Badge>
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {item.rateDescription || item.sector || '—'}
                    </td>
                    <td className="money-value py-2.5 text-right text-slate-200">
                      {item.price > 0
                        ? item.market === 'US'
                          ? `US$ ${item.price.toFixed(2)}`
                          : formatBRL(item.price)
                        : '—'}
                    </td>
                    <td className="money-value py-2.5 text-right text-slate-300">
                      {item.peRatio !== null ? item.peRatio.toFixed(2) : '—'}
                    </td>
                    <td className="money-value py-2.5 text-right text-slate-300">
                      {(item.pVpa ?? item.pbRatio) !== null
                        ? Number(item.pVpa ?? item.pbRatio).toFixed(2)
                        : '—'}
                    </td>
                    <td className="money-value py-2.5 text-right text-emerald-400">
                      {item.dividendYield !== null ? formatPercent(item.dividendYield) : '—'}
                    </td>
                    <td className="money-value py-2.5 text-right text-slate-300">
                      {item.roe !== null ? formatPercent(item.roe) : '—'}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="inline-flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            aria-label={`Dar nota ${star} para ${item.code}`}
                            onClick={() => handleRate(item.code, star)}
                            className={
                              (item.userRating ?? 0) >= star
                                ? 'text-gold-400'
                                : 'text-slate-700 hover:text-gold-300'
                            }
                          >
                            <Star className="h-3.5 w-3.5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
