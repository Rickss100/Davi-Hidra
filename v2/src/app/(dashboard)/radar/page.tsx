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
  | 'psr'
  | 'dividendYield'
  | 'roe'
  | 'roic'
  | 'profitMargin'
  | 'debtToEquity'
  | 'currentRatio'
  | 'vacancyRate'
  | 'capRate'
  | 'ffoYield'
  | 'propertyCount'
  | 'liquidity'
  | 'userRating';

function fmtRatio(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return Number(v).toFixed(2);
}

function fmtPercentOrDash(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return formatPercent(Number(v));
}

function fmtCompactMoney(val: number | null | undefined): string {
  if (val === null || val === undefined || val === 0) return '—';
  if (val >= 1_000_000_000) return `R$ ${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}k`;
  return formatBRL(val);
}

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
        case 'psr':
          valA = a.psr;
          valB = b.psr;
          break;
        case 'dividendYield':
          valA = a.dividendYield;
          valB = b.dividendYield;
          break;
        case 'roe':
          valA = a.roe;
          valB = b.roe;
          break;
        case 'roic':
          valA = a.roic;
          valB = b.roic;
          break;
        case 'profitMargin':
          valA = a.profitMargin;
          valB = b.profitMargin;
          break;
        case 'debtToEquity':
          valA = a.debtToEquity;
          valB = b.debtToEquity;
          break;
        case 'currentRatio':
          valA = a.currentRatio;
          valB = b.currentRatio;
          break;
        case 'vacancyRate':
          valA = a.vacancyRate;
          valB = b.vacancyRate;
          break;
        case 'capRate':
          valA = a.capRate;
          valB = b.capRate;
          break;
        case 'ffoYield':
          valA = a.ffoYield;
          valB = b.ffoYield;
          break;
        case 'propertyCount':
          valA = a.propertyCount;
          valB = b.propertyCount;
          break;
        case 'liquidity':
          valA = a.liquidity;
          valB = b.liquidity;
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

  const renderSortTh = (
    label: string,
    key?: SortKey,
    align: 'left' | 'right' | 'center' = 'right',
    className?: string
  ) => {
    const isSorted = key && sortKey === key;
    return (
      <th
        onClick={key ? () => handleSort(key) : undefined}
        className={cn(
          'px-2 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-300 select-none whitespace-nowrap',
          align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right',
          key && 'cursor-pointer hover:text-white hover:bg-obsidian-900/60',
          className
        )}
      >
        <div
          className={cn(
            'inline-flex items-center gap-1',
            align === 'right' && 'justify-end',
            align === 'center' && 'justify-center'
          )}
        >
          <span>{label}</span>
          {key && (
            <ArrowUpDown
              className={cn(
                'h-3 w-3',
                isSorted ? 'text-emerald-400 opacity-100' : 'opacity-40'
              )}
            />
          )}
        </div>
      </th>
    );
  };

  const isFiis = typeFilter === 'fiis';
  const isStocks = typeFilter === 'stocks';
  const isReits = typeFilter === 'reits';
  const isFixed = typeFilter === 'fixed';
  const isAcoes = typeFilter === 'acoes';
  const isAll = typeFilter === 'all';

  return (
    <div className="space-y-4 w-full">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white sm:text-2xl lg:text-3xl">
            Radar Fundamentalista — Método DAVI
          </h1>
          <p className="mt-0.5 text-xs text-slate-300 sm:text-sm">
            Peneire empresas e fundos pelos fundamentos, avalie com estrelas (★) e envie suas escolhas direto para Meus Objetivos.
          </p>
        </div>

        <Link
          href="/definir-objetivos"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-gold-500/50 bg-gold-500/15 px-3.5 text-xs font-extrabold text-gold-200 transition hover:bg-gold-500/25 sm:text-sm"
        >
          <Target className="h-4 w-4 text-gold-400" />
          Meus Objetivos ({targetCodesSet.size} ativos na meta)
        </Link>
      </div>

      {/* Barra de Busca, Filtro Mobile e Tabs de Categorias */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <div className="flex w-full flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <label htmlFor="radar-search" className="sr-only">
              Buscar ativo por código, empresa ou setor
            </label>
            <Input
              id="radar-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar código, nome da empresa ou setor..."
              className="h-10 pl-9 text-xs sm:text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            aria-label="Abrir filtros do Método DAVI"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-3 text-xs font-extrabold text-emerald-300 lg:hidden"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-extrabold transition sm:text-sm',
                typeFilter === t.id
                  ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                  : 'border border-slate-700 bg-obsidian-950 text-slate-200 hover:border-gold-400/50 hover:text-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {feedback && (
        <div className="rounded-xl border-2 border-emerald-400/50 bg-[#081a14] p-3 text-xs font-bold text-emerald-200 sm:text-sm">
          {feedback}
        </div>
      )}

      {/* Layout Principal: Sidebar Método DAVI à Esquerda + Tabela Totalmente Expandida à Direita */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start w-full">
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

        {/* Box da Tabela de Ativos — Ocupa 100% da Largura Livre */}
        <div className="min-w-0 flex-1 w-full">
          {isLoading || !data ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <Card className="p-0 overflow-hidden w-full border border-slate-800 shadow-xl">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-[13px] border-collapse">
                  <thead className="border-b border-slate-800 bg-obsidian-950 text-slate-300">
                    <tr>
                      {renderSortTh('Código / Ativo', 'code', 'left', 'pl-3 pr-2')}

                      {/* Colunas específicas por classe */}
                      {isAll && renderSortTh('Classe', undefined, 'center')}

                      {isFixed ? (
                        <>
                          {renderSortTh('Instrumento', undefined, 'left')}
                          {renderSortTh('Taxa / Indexador', undefined, 'left')}
                          {renderSortTh('Rentab. Est.', 'dividendYield')}
                          {renderSortTh('Liquidez', undefined, 'center')}
                          {renderSortTh('Aporte Mín.', undefined)}
                        </>
                      ) : isFiis ? (
                        <>
                          {renderSortTh('Cotação', 'price')}
                          {renderSortTh('P/VP', 'pbRatio')}
                          {renderSortTh('Div. Yield', 'dividendYield')}
                          {renderSortTh('FFO Yield', 'ffoYield')}
                          {renderSortTh('Vacância', 'vacancyRate')}
                          {renderSortTh('Cap Rate', 'capRate')}
                          {renderSortTh('Qtd Imóv.', 'propertyCount')}
                          {renderSortTh('Liquidez', 'liquidity')}
                        </>
                      ) : isReits ? (
                        <>
                          {renderSortTh('Cotação', 'price')}
                          {renderSortTh('P/FFO', 'peRatio')}
                          {renderSortTh('P/VP', 'pbRatio')}
                          {renderSortTh('Div. Yield', 'dividendYield')}
                          {renderSortTh('FFO Yield', 'ffoYield')}
                          {renderSortTh('Vacância', 'vacancyRate')}
                          {renderSortTh('Qtd Imóv.', 'propertyCount')}
                          {renderSortTh('Dív/PL', 'debtToEquity')}
                        </>
                      ) : isStocks ? (
                        <>
                          {renderSortTh('Cotação', 'price')}
                          {renderSortTh('P/L', 'peRatio')}
                          {renderSortTh('P/VP', 'pbRatio')}
                          {renderSortTh('PSR', 'psr')}
                          {renderSortTh('Div. Yield', 'dividendYield')}
                          {renderSortTh('ROE', 'roe')}
                          {renderSortTh('ROIC', 'roic')}
                          {renderSortTh('Mrg. Líq.', 'profitMargin')}
                          {renderSortTh('Dív/PL', 'debtToEquity')}
                        </>
                      ) : (
                        /* Ações BR e Visão Geral "Todos" */
                        <>
                          {renderSortTh('Cotação', 'price')}
                          {renderSortTh('P/L', 'peRatio')}
                          {renderSortTh('P/VP', 'pbRatio')}
                          {isAcoes && renderSortTh('PSR', 'psr')}
                          {renderSortTh('Div. Yield', 'dividendYield')}
                          {renderSortTh('ROE', 'roe')}
                          {renderSortTh('ROIC', 'roic')}
                          {isAcoes && renderSortTh('Mrg. Líq.', 'profitMargin')}
                          {renderSortTh('Liq. Corr.', 'currentRatio')}
                          {renderSortTh('Dív/PL', 'debtToEquity')}
                        </>
                      )}

                      {renderSortTh('Sua Nota', 'userRating', 'center')}
                      <th className="px-3 py-2.5 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-300 whitespace-nowrap">
                        Minha Meta
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60 bg-obsidian-950/40">
                    {sortedItems.slice(0, 300).map((item) => {
                      const inMeta = targetCodesSet.has(item.code.toUpperCase());
                      const showFullName = item.name.toUpperCase() !== item.code.toUpperCase();
                      const isBusy = togglingCode === item.code;

                      return (
                        <tr
                          key={item.code}
                          className="hover:bg-obsidian-800/40 transition-colors"
                        >
                          {/* Código e Nome */}
                          <td className="pl-3 pr-2 py-2">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-white text-xs sm:text-sm tracking-wide">
                                {item.code}
                              </span>
                              {showFullName && (
                                <span
                                  className="text-[10.5px] text-slate-400 truncate max-w-[130px] 2xl:max-w-[180px]"
                                  title={item.name}
                                >
                                  {item.name}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Classe (se aba Todos) */}
                          {isAll && (
                            <td className="px-2 py-2 text-center whitespace-nowrap">
                              <Badge tone="slate" className="text-[10.5px] font-bold py-0.5 px-1.5">
                                {item.type}
                              </Badge>
                            </td>
                          )}

                          {/* Dados de Renda Fixa */}
                          {isFixed ? (
                            <>
                              <td className="px-2 py-2 text-slate-300 truncate max-w-[140px]">
                                {item.sector || 'Renda Fixa'}
                              </td>
                              <td className="px-2 py-2 font-medium text-slate-200 truncate max-w-[140px]">
                                {item.rateDescription || '100% CDI'}
                              </td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                                {fmtPercentOrDash(item.dividendYield)}
                              </td>
                              <td className="px-2 py-2 text-center text-slate-300 text-xs whitespace-nowrap">
                                {item.liquidityType || 'D+0'}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {item.minInvestment ? formatBRL(item.minInvestment) : '—'}
                              </td>
                            </>
                          ) : isFiis ? (
                            /* Dados de FIIs */
                            <>
                              <td className="px-2 py-2 text-right font-mono font-semibold text-slate-100 whitespace-nowrap">
                                {item.price > 0 ? formatBRL(item.price) : '—'}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtRatio(item.pVpa ?? item.pbRatio)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                                {fmtPercentOrDash(item.dividendYield)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtPercentOrDash(item.ffoYield)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {fmtPercentOrDash(item.vacancyRate)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {fmtPercentOrDash(item.capRate)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {item.propertyCount != null ? Math.round(item.propertyCount) : '—'}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {fmtCompactMoney(item.liquidity)}
                              </td>
                            </>
                          ) : isReits ? (
                            /* Dados de REITs EUA */
                            <>
                              <td className="px-2 py-2 text-right font-mono font-semibold text-slate-100 whitespace-nowrap">
                                {item.price > 0 ? `US$ ${item.price.toFixed(2)}` : '—'}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtRatio(item.peRatio)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtRatio(item.pVpa ?? item.pbRatio)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                                {fmtPercentOrDash(item.dividendYield)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtPercentOrDash(item.ffoYield)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {fmtPercentOrDash(item.vacancyRate)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {item.propertyCount != null ? Math.round(item.propertyCount) : '—'}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {fmtRatio(item.debtToEquity)}
                              </td>
                            </>
                          ) : isStocks ? (
                            /* Dados de Stocks EUA */
                            <>
                              <td className="px-2 py-2 text-right font-mono font-semibold text-slate-100 whitespace-nowrap">
                                {item.price > 0 ? `US$ ${item.price.toFixed(2)}` : '—'}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtRatio(item.peRatio)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtRatio(item.pbRatio ?? item.pVpa)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {fmtRatio(item.psr)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                                {fmtPercentOrDash(item.dividendYield)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtPercentOrDash(item.roe)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtPercentOrDash(item.roic)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {fmtPercentOrDash(item.profitMargin)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {fmtRatio(item.debtToEquity)}
                              </td>
                            </>
                          ) : (
                            /* Dados de Ações BR & Visão Geral Todos */
                            <>
                              <td className="px-2 py-2 text-right font-mono font-semibold text-slate-100 whitespace-nowrap">
                                {item.price > 0
                                  ? item.market === 'US'
                                    ? `US$ ${item.price.toFixed(2)}`
                                    : formatBRL(item.price)
                                  : '—'}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtRatio(item.peRatio)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtRatio(item.pVpa ?? item.pbRatio)}
                              </td>
                              {isAcoes && (
                                <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                  {fmtRatio(item.psr)}
                                </td>
                              )}
                              <td className="px-2 py-2 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                                {fmtPercentOrDash(item.dividendYield)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtPercentOrDash(item.roe)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-200 whitespace-nowrap">
                                {fmtPercentOrDash(item.roic)}
                              </td>
                              {isAcoes && (
                                <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                  {fmtPercentOrDash(item.profitMargin)}
                                </td>
                              )}
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {fmtRatio(item.currentRatio)}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-slate-300 whitespace-nowrap">
                                {fmtRatio(item.debtToEquity)}
                              </td>
                            </>
                          )}

                          {/* Avaliação por Estrelas (1 a 5) */}
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <div
                              className="inline-flex items-center gap-0.5"
                              title="Avalie com 1 a 5 estrelas"
                            >
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  aria-label={`Avaliar ${item.code} com ${star} estrela${star > 1 ? 's' : ''}`}
                                  onClick={() => handleRate(item.code, star)}
                                  className={cn(
                                    'p-0.5 transition-colors',
                                    (item.userRating ?? 0) >= star
                                      ? 'text-gold-400 hover:text-gold-300'
                                      : 'text-slate-700 hover:text-gold-400/80'
                                  )}
                                >
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                </button>
                              ))}
                            </div>
                          </td>

                          {/* Botão Minha Meta */}
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <Button
                              type="button"
                              size="sm"
                              variant={inMeta ? 'emerald' : 'outline'}
                              disabled={isBusy}
                              onClick={() => handleToggleTarget(item)}
                              className="h-7 px-2.5 text-xs font-bold whitespace-nowrap"
                            >
                              {inMeta ? (
                                <>
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  Na Meta
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  + Meta
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
                  <div className="p-8 text-center text-xs text-slate-300 sm:text-sm">
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
