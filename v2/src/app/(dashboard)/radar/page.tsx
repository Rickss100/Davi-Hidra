'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpDown,
  Check,
  Filter,
  Plus,
  Search,
  Star,
  Target,
  X
} from 'lucide-react';
import { Badge, Button, Card, Input, Skeleton } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import { usePortfolioData } from '@/hooks/use-portfolio';
import {
  DaviSidebarFilters,
  type DaviFilterMap
} from '@/components/radar/davi-sidebar-filters';
import {
  matchesDaviFilterMap,
  type ComprehensiveRadarItem
} from '@/components/radar/radar-matcher';
import { cn } from '@/lib/utils';

const CATEGORY_TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'acoes', label: 'Ações BR' },
  { id: 'fiis', label: 'FIIs BR' },
  { id: 'fixed', label: 'Renda Fixa' },
  { id: 'stocks', label: 'Stocks EUA' },
  { id: 'reits', label: 'REITs EUA' }
];

type SortKey =
  | 'code'
  | 'price'
  | 'peRatio'
  | 'pbRatio'
  | 'dividendYield'
  | 'roe'
  | 'debtToEquity'
  | 'currentRatio'
  | 'userRating';

export default function RadarAtivosPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [daviFilters, setDaviFilters] = useState<DaviFilterMap>({});
  const [togglingCode, setTogglingCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('dividendYield');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { data: portfolioData, refetch: refetchPortfolio } = usePortfolioData();

  // Respeita filtro inicial vindo de Definir Objetivos (ex: /radar?type=acoes)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialType = (params.get('type') || '').toLowerCase();
    if (CATEGORY_TABS.some((t) => t.id === initialType)) {
      setTypeFilter(initialType);
    }
  }, []);

  const { data, isLoading, refetch } = useQuery<{
    totalCatalog: number;
    items: ComprehensiveRadarItem[];
  }>({
    queryKey: ['radar-assets-full', typeFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: typeFilter,
        q: search,
        limit: '1500'
      });
      const res = await fetch(`/api/radar?${params.toString()}`);
      return res.json();
    }
  });

  const targetCodesSet = useMemo(() => {
    const set = new Set<string>();
    const t = portfolioData?.snapshot.objectives.assetTargets;
    if (!t) return set;
    for (const cat of ['acoes', 'fiis', 'stocks', 'reits', 'fixed'] as const) {
      for (const item of t[cat] || []) {
        set.add(item.code.toUpperCase());
      }
    }
    return set;
  }, [portfolioData]);

  // Aplicação estrita dos filtros do Método DAVI
  const filteredItems = useMemo(() => {
    const list = data?.items || [];
    return list.filter((item) => matchesDaviFilterMap(item, daviFilters));
  }, [data, daviFilters]);

  // Ordenação por coluna clicável
  const sortedItems = useMemo(() => {
    const arr = [...filteredItems];
    return arr.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;

      if (sortKey === 'code') {
        return a.code.localeCompare(b.code) * dir;
      }

      let valA: number | null = null;
      let valB: number | null = null;

      switch (sortKey) {
        case 'price':
          valA = a.price;
          valB = b.price;
          break;
        case 'peRatio':
          valA = a.peRatio;
          valB = b.peRatio;
          break;
        case 'pbRatio':
          valA = a.pVpa ?? a.pbRatio;
          valB = b.pVpa ?? b.pbRatio;
          break;
        case 'dividendYield':
          valA = a.dividendYield;
          valB = b.dividendYield;
          break;
        case 'roe':
          valA = a.roe;
          valB = b.roe;
          break;
        case 'debtToEquity':
          valA = a.debtToEquity;
          valB = b.debtToEquity;
          break;
        case 'currentRatio':
          valA = a.currentRatio;
          valB = b.currentRatio;
          break;
        case 'userRating':
          valA = a.userRating;
          valB = b.userRating;
          break;
      }

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      return (valA - valB) * dir;
    });
  }, [filteredItems, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'code' ? 'asc' : 'desc');
    }
  };

  const handleRate = async (assetCode: string, rating: number) => {
    await fetch('/api/radar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetCode, rating })
    });
    await refetch();
  };

  const handleToggleTarget = async (item: ComprehensiveRadarItem) => {
    setTogglingCode(item.code);
    try {
      const wasInMeta = targetCodesSet.has(item.code.toUpperCase());
      const res = await fetch('/api/portfolio/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toggleAsset: {
            category: item.category,
            code: item.code,
            sector: item.sector || undefined
          }
        })
      });
      if (res.ok) {
        await refetchPortfolio();
        setFeedback(
          wasInMeta
            ? `Ativo ${item.code} removido dos seus Objetivos.`
            : `✓ ${item.code} enviado para Meus Objetivos com sucesso!`
        );
        setTimeout(() => setFeedback(''), 3500);
      }
    } finally {
      setTogglingCode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Radar Fundamentalista — Método DAVI
          </h1>
          <p className="mt-1 text-sm text-slate-200 sm:text-base">
            Peneire empresas e fundos pelos fundamentos, avalie com estrelas (★) e envie suas escolhas direto para Meus Objetivos.
          </p>
        </div>

        <Link
          href="/definir-objetivos"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-gold-500/50 bg-gold-500/15 px-4 text-sm font-extrabold text-gold-200 transition hover:bg-gold-500/25"
        >
          <Target className="h-4 w-4 text-gold-400" />
          Meus Objetivos ({targetCodesSet.size} ativos na meta)
        </Link>
      </div>

      {/* Barra de Busca, Filtro Mobile e Tabs de Categorias */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex w-full flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <label htmlFor="radar-search" className="sr-only">
              Buscar ativo por código, empresa ou setor
            </label>
            <Input
              id="radar-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar código, nome da empresa ou setor..."
              className="h-11 pl-10 text-sm sm:text-base"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            aria-label="Abrir filtros do Método DAVI"
            className="flex h-11 items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-3 text-xs font-extrabold text-emerald-300 lg:hidden"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={cn(
                'rounded-xl px-3.5 py-2 text-sm font-extrabold transition',
                typeFilter === t.id
                  ? 'bg-gold-500 text-obsidian-950'
                  : 'border border-slate-700 bg-obsidian-950 text-slate-200 hover:border-gold-400/50 hover:text-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {feedback && (
        <div className="rounded-xl border-2 border-emerald-400/50 bg-[#081a14] p-3.5 text-sm font-bold text-emerald-200">
          {feedback}
        </div>
      )}

      {/* Layout Principal: Sidebar Método DAVI à Esquerda + Tabela à Direita */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Sidebar Desktop */}
        <div className="hidden shrink-0 lg:block">
          <DaviSidebarFilters
            category={typeFilter}
            totalAssets={data?.items.length ?? 0}
            filteredCount={filteredItems.length}
            onApplyFilters={(f) => setDaviFilters(f)}
            onClearFilters={() => setDaviFilters({})}
          />
        </div>

        {/* Modal / Drawer Mobile para os Filtros */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 lg:hidden">
            <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700 bg-obsidian-950 p-4">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <DaviSidebarFilters
                category={typeFilter}
                totalAssets={data?.items.length ?? 0}
                filteredCount={filteredItems.length}
                onApplyFilters={(f) => {
                  setDaviFilters(f);
                  setIsMobileFiltersOpen(false);
                }}
                onClearFilters={() => {
                  setDaviFilters({});
                  setIsMobileFiltersOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Tabela de Ativos Lapidados */}
        <div className="min-w-0 flex-1">
          {isLoading || !data ? (
            <Skeleton className="h-96" />
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-800 bg-obsidian-950 text-xs font-bold uppercase tracking-wider text-slate-200 sm:text-sm">
                    <tr>
                      <th
                        className="cursor-pointer px-4 py-3.5 select-none hover:text-white"
                        onClick={() => handleSort('code')}
                      >
                        <span className="flex items-center gap-1">
                          Código / Ativo
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </span>
                      </th>
                      <th className="px-3 py-3.5">Classe</th>
                      <th className="px-3 py-3.5">Setor / Taxa</th>
                      <th
                        className="cursor-pointer px-3 py-3.5 text-right select-none hover:text-white"
                        onClick={() => handleSort('price')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          Cotação
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </span>
                      </th>
                      <th
                        className="cursor-pointer px-3 py-3.5 text-right select-none hover:text-white"
                        onClick={() => handleSort('peRatio')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          P/L
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </span>
                      </th>
                      <th
                        className="cursor-pointer px-3 py-3.5 text-right select-none hover:text-white"
                        onClick={() => handleSort('pbRatio')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          P/VP
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </span>
                      </th>
                      <th
                        className="cursor-pointer px-3 py-3.5 text-right select-none hover:text-white"
                        onClick={() => handleSort('dividendYield')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          DY %
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </span>
                      </th>
                      <th
                        className="cursor-pointer px-3 py-3.5 text-right select-none hover:text-white"
                        onClick={() => handleSort('roe')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          ROE %
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </span>
                      </th>
                      <th
                        className="cursor-pointer px-3 py-3.5 text-right select-none hover:text-white"
                        onClick={() => handleSort('debtToEquity')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          Dív/PL
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </span>
                      </th>
                      <th
                        className="cursor-pointer px-3 py-3.5 text-center select-none hover:text-white"
                        onClick={() => handleSort('userRating')}
                      >
                        <span className="flex items-center justify-center gap-1">
                          Sua Nota
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </span>
                      </th>
                      <th className="px-4 py-3.5 text-right">Minha Meta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {sortedItems.slice(0, 300).map((item) => {
                      const inMeta = targetCodesSet.has(item.code.toUpperCase());
                      const showFullName = item.name.toUpperCase() !== item.code.toUpperCase();
                      const isBusy = togglingCode === item.code;

                      return (
                        <tr key={item.code} className="hover:bg-obsidian-800/50">
                          <td className="px-4 py-3">
                            <span className="block text-base font-extrabold text-white">
                              {item.code}
                            </span>
                            {showFullName && (
                              <span className="block max-w-[200px] truncate text-xs font-medium text-slate-300 sm:text-sm">
                                {item.name}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <Badge tone="slate" className="text-xs font-bold">
                              {item.type}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-200 sm:text-sm max-w-[160px] truncate">
                            {item.rateDescription || item.sector || '—'}
                          </td>
                          <td className="money-value px-3 py-3 text-right font-bold text-slate-100">
                            {item.price > 0
                              ? item.market === 'US'
                                ? `US$ ${item.price.toFixed(2)}`
                                : formatBRL(item.price)
                              : '—'}
                          </td>
                          <td className="money-value px-3 py-3 text-right text-slate-200">
                            {item.peRatio !== null ? item.peRatio.toFixed(2) : '—'}
                          </td>
                          <td className="money-value px-3 py-3 text-right text-slate-200">
                            {(item.pVpa ?? item.pbRatio) !== null
                              ? Number(item.pVpa ?? item.pbRatio).toFixed(2)
                              : '—'}
                          </td>
                          <td className="money-value px-3 py-3 text-right font-bold text-emerald-400">
                            {item.dividendYield !== null ? formatPercent(item.dividendYield) : '—'}
                          </td>
                          <td className="money-value px-3 py-3 text-right text-slate-200">
                            {item.roe !== null ? formatPercent(item.roe) : '—'}
                          </td>
                          <td className="money-value px-3 py-3 text-right text-slate-200">
                            {item.debtToEquity !== null ? item.debtToEquity.toFixed(2) : '—'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="inline-flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  aria-label={`Dar nota ${star} para ${item.code}`}
                                  onClick={() => handleRate(item.code, star)}
                                  className={
                                    (item.userRating ?? 0) >= star
                                      ? 'text-gold-400'
                                      : 'text-slate-600 hover:text-gold-300'
                                  }
                                >
                                  <Star className="h-4 w-4 fill-current" />
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant={inMeta ? 'emerald' : 'outline'}
                              disabled={isBusy}
                              onClick={() => handleToggleTarget(item)}
                              className="h-9 px-3 text-xs font-extrabold sm:text-sm"
                            >
                              {inMeta ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Na Meta
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  Incluir na Meta
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {sortedItems.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-200 sm:text-base">
                    Nenhum ativo passou pelos critérios atuais do filtro DAVI. Relaxe algum indicador na barra lateral ou clique em <strong className="text-gold-300">Limpar</strong>.
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
