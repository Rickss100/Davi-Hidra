'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Shield,
  TrendingUp,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DaviProfileKey = 'conservador' | 'moderado' | 'agressivo';

export interface FilterBound {
  min?: number | null;
  max?: number | null;
}

export type DaviFilterMap = Record<string, FilterBound>;

export interface FilterDefinition {
  key: string;
  label: string;
  type: 'min' | 'max' | 'range';
  step?: number;
}

export const PRESETS: Record<
  DaviProfileKey,
  {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    filters: Record<string, Record<string, FilterBound>>;
  }
> = {
  conservador: {
    name: 'Conservador',
    icon: Shield,
    description: 'Filtros rigorosos para máxima segurança e empresas sólidas',
    filters: {
      acoes: {
        pe_ratio: { min: 0.01, max: 12 },
        pb_ratio: { max: 2 },
        dividend_yield: { min: 4 },
        roe: { min: 15 },
        current_ratio: { min: 1.5 },
        debt_to_equity: { max: 0.5 }
      },
      fiis: {
        p_vpa: { min: 0.85, max: 1.05 },
        dividend_yield: { min: 9 },
        vacancy_rate: { max: 5 },
        liquidity: { min: 500000 }
      },
      stocks: {
        pe_ratio: { min: 0.01, max: 22 },
        pb_ratio: { max: 4 },
        dividend_yield: { min: 2.0 },
        roe: { min: 15 },
        debt_to_equity: { max: 1.0 }
      },
      reits: {
        pe_ratio: { min: 0.01, max: 16 },
        p_vpa: { max: 1.15 },
        dividend_yield: { min: 4.0 },
        vacancy_rate: { max: 5 }
      },
      fixed: {
        dividend_yield: { min: 10 },
        liquidity: { min: 1000000 }
      }
    }
  },
  moderado: {
    name: 'Moderado',
    icon: TrendingUp,
    description: 'Equilíbrio padrão ouro entre segurança, dividendos e valuation',
    filters: {
      acoes: {
        pe_ratio: { min: 0.01, max: 15 },
        pb_ratio: { max: 3 },
        dividend_yield: { min: 3 },
        roe: { min: 10 },
        current_ratio: { min: 1.0 },
        debt_to_equity: { max: 1.0 }
      },
      fiis: {
        p_vpa: { min: 0.8, max: 1.15 },
        dividend_yield: { min: 7 },
        vacancy_rate: { max: 10 },
        liquidity: { min: 200000 }
      },
      stocks: {
        pe_ratio: { min: 0.01, max: 32 },
        pb_ratio: { max: 7 },
        dividend_yield: { min: 0.8 },
        roe: { min: 15 }
      },
      reits: {
        pe_ratio: { min: 0.01, max: 20 },
        p_vpa: { max: 1.3 },
        dividend_yield: { min: 3.5 },
        vacancy_rate: { max: 8 }
      },
      fixed: {
        dividend_yield: { min: 11 }
      }
    }
  },
  agressivo: {
    name: 'Agressivo',
    icon: Zap,
    description: 'Maior flexibilidade para capturar oportunidades de crescimento',
    filters: {
      acoes: {
        pe_ratio: { min: 0.01, max: 20 },
        pb_ratio: { max: 5 },
        dividend_yield: { min: 2 },
        roe: { min: 8 }
      },
      fiis: {
        p_vpa: { min: 0.7, max: 1.3 },
        dividend_yield: { min: 5 },
        vacancy_rate: { max: 15 }
      },
      stocks: {
        pe_ratio: { min: 0.01, max: 45 },
        roe: { min: 12 }
      },
      reits: {
        pe_ratio: { min: 0.01, max: 26 },
        dividend_yield: { min: 2.5 },
        vacancy_rate: { max: 12 }
      },
      fixed: {
        dividend_yield: { min: 12 }
      }
    }
  }
};

export const FILTER_GROUPS: Record<string, Record<string, FilterDefinition[]>> = {
  acoes: {
    Valuation: [
      { key: 'pe_ratio', label: 'P/L', type: 'range', step: 0.5 },
      { key: 'pb_ratio', label: 'P/VP', type: 'max', step: 0.1 },
      { key: 'ev_ebit', label: 'EV/EBIT', type: 'range', step: 0.5 },
      { key: 'ev_ebitda', label: 'EV/EBITDA', type: 'range', step: 0.5 },
      { key: 'psr', label: 'PSR', type: 'max', step: 0.1 }
    ],
    Rentabilidade: [
      { key: 'dividend_yield', label: 'Div. Yield (%)', type: 'min', step: 0.5 },
      { key: 'roe', label: 'ROE (%)', type: 'min', step: 1 },
      { key: 'roic', label: 'ROIC (%)', type: 'min', step: 1 },
      { key: 'roa', label: 'ROA (%)', type: 'min', step: 1 },
      { key: 'ebit_margin', label: 'Mrg. EBIT (%)', type: 'min', step: 1 },
      { key: 'profit_margin', label: 'Mrg. Líquida (%)', type: 'min', step: 1 }
    ],
    Dívida: [
      { key: 'current_ratio', label: 'Liq. Corrente', type: 'min', step: 0.1 },
      { key: 'debt_to_equity', label: 'Dív/PL', type: 'max', step: 0.1 },
      { key: 'net_debt_ebitda', label: 'Dív.Líq/EBITDA', type: 'max', step: 0.5 }
    ],
    Crescimento: [
      { key: 'revenue_growth', label: 'Cresc. Receita (%)', type: 'min', step: 1 },
      { key: 'revenue_growth_5y', label: 'Cresc. Rec. 5a (%)', type: 'min', step: 1 },
      { key: 'earnings_growth', label: 'Cresc. Lucros (%)', type: 'min', step: 1 }
    ],
    Outros: [
      { key: 'payout_ratio', label: 'Payout (%)', type: 'range', step: 5 },
      { key: 'market_cap', label: 'Valor Mercado (M)', type: 'min', step: 100 }
    ],
    '⭐ Minhas Notas': [{ key: 'user_rating', label: 'Nota mínima', type: 'min', step: 1 }]
  },
  fiis: {
    Valuation: [{ key: 'p_vpa', label: 'P/VP', type: 'range', step: 0.05 }],
    Rentabilidade: [
      { key: 'dividend_yield', label: 'Div. Yield (%)', type: 'min', step: 0.5 },
      { key: 'ffo_yield', label: 'FFO Yield (%)', type: 'min', step: 0.5 },
      { key: 'cap_rate', label: 'Cap Rate (%)', type: 'min', step: 0.5 }
    ],
    Qualidade: [
      { key: 'vacancy_rate', label: 'Vacância (%)', type: 'max', step: 1 },
      { key: 'property_count', label: 'Qtd Imóveis', type: 'min', step: 1 },
      { key: 'price_per_sqm', label: 'Preço/m² (R$)', type: 'max', step: 100 },
      { key: 'rent_per_sqm', label: 'Aluguel/m² (R$)', type: 'min', step: 1 }
    ],
    Liquidez: [
      { key: 'liquidity', label: 'Liquidez (R$)', type: 'min', step: 50000 },
      { key: 'market_cap', label: 'Valor Mercado (M)', type: 'min', step: 100 }
    ],
    '⭐ Minhas Notas': [{ key: 'user_rating', label: 'Nota mínima', type: 'min', step: 1 }]
  },
  stocks: {
    Valuation: [
      { key: 'pe_ratio', label: 'P/L (P/E)', type: 'range', step: 1 },
      { key: 'pb_ratio', label: 'P/VP (P/B)', type: 'max', step: 0.5 },
      { key: 'ev_ebitda', label: 'EV/EBITDA', type: 'range', step: 1 },
      { key: 'psr', label: 'PSR (P/S)', type: 'max', step: 0.5 }
    ],
    Rentabilidade: [
      { key: 'dividend_yield', label: 'Div. Yield (%)', type: 'min', step: 0.5 },
      { key: 'roe', label: 'ROE (%)', type: 'min', step: 1 },
      { key: 'roic', label: 'ROIC (%)', type: 'min', step: 1 },
      { key: 'profit_margin', label: 'Mrg. Líquida (%)', type: 'min', step: 1 }
    ],
    'Dívida & Tamanho': [
      { key: 'current_ratio', label: 'Liq. Corrente', type: 'min', step: 0.1 },
      { key: 'debt_to_equity', label: 'Dív/PL', type: 'max', step: 0.1 },
      { key: 'market_cap', label: 'Valor Mercado ($B)', type: 'min', step: 10 }
    ],
    '⭐ Minhas Notas': [{ key: 'user_rating', label: 'Nota mínima', type: 'min', step: 1 }]
  },
  reits: {
    Valuation: [
      { key: 'pe_ratio', label: 'P/FFO', type: 'range', step: 1 },
      { key: 'p_vpa', label: 'P/VP (P/NAV)', type: 'range', step: 0.05 },
      { key: 'psr', label: 'PSR', type: 'max', step: 0.5 }
    ],
    Rentabilidade: [
      { key: 'dividend_yield', label: 'Div. Yield (%)', type: 'min', step: 0.5 },
      { key: 'ffo_yield', label: 'FFO Yield (%)', type: 'min', step: 0.5 },
      { key: 'payout_ratio', label: 'Payout FFO Máx (%)', type: 'max', step: 5 }
    ],
    'Qualidade & Imóveis': [
      { key: 'vacancy_rate', label: 'Vacância Máx (%)', type: 'max', step: 1 },
      { key: 'property_count', label: 'Qtd Imóveis Mín', type: 'min', step: 10 }
    ],
    'Dívida & Tamanho': [
      { key: 'debt_to_equity', label: 'Dív/PL', type: 'max', step: 0.1 },
      { key: 'current_ratio', label: 'Liq. Corrente', type: 'min', step: 0.1 },
      { key: 'market_cap', label: 'Valor Mercado ($B)', type: 'min', step: 1 }
    ],
    '⭐ Minhas Notas': [{ key: 'user_rating', label: 'Nota mínima', type: 'min', step: 1 }]
  },
  fixed: {
    Rentabilidade: [
      { key: 'dividend_yield', label: 'Rentab. Mínima (% a.a.)', type: 'min', step: 0.5 },
      { key: 'rate_fixed', label: 'Taxa / Cupom Mínimo (%)', type: 'min', step: 0.5 }
    ],
    'Aporte & Liquidez': [
      { key: 'min_investment', label: 'Aporte Máximo (R$)', type: 'max', step: 100 },
      { key: 'liquidity', label: 'Liquidez Mínima (R$)', type: 'min', step: 100000 }
    ],
    '⭐ Minhas Notas': [{ key: 'user_rating', label: 'Nota mínima', type: 'min', step: 1 }]
  }
};

export interface DaviSidebarFiltersProps {
  category: string;
  totalAssets: number;
  filteredCount: number;
  onApplyFilters: (filters: DaviFilterMap) => void;
  onClearFilters: () => void;
}

export function DaviSidebarFilters({
  category,
  totalAssets,
  filteredCount,
  onApplyFilters,
  onClearFilters
}: DaviSidebarFiltersProps) {
  const [selectedPreset, setSelectedPreset] = useState<DaviProfileKey | null>('moderado');
  const [filters, setFilters] = useState<DaviFilterMap>({});
  const [activeCheckboxes, setActiveCheckboxes] = useState<Record<string, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  const normalizedCategory =
    category === 'all'
      ? 'acoes'
      : category === 'acao'
        ? 'acoes'
        : category === 'fii'
          ? 'fiis'
          : category === 'stock'
            ? 'stocks'
            : category === 'reit'
              ? 'reits'
              : category === 'fixa'
                ? 'fixed'
                : category;

  const currentGroups = FILTER_GROUPS[normalizedCategory] || FILTER_GROUPS.acoes!;

  // Aplica o perfil Moderado por padrão na inicialização e ao trocar de categoria (como na V1)
  const applyPreset = (presetKey: DaviProfileKey) => {
    const preset = PRESETS[presetKey];
    const categoryFilters = preset.filters[normalizedCategory] || preset.filters.acoes || {};

    const nextFilters: DaviFilterMap = {};
    const nextCheckboxes: Record<string, boolean> = {};

    Object.entries(categoryFilters).forEach(([key, bound]) => {
      nextFilters[key] = { ...bound };
      nextCheckboxes[key] = true;
    });

    setFilters(nextFilters);
    setActiveCheckboxes(nextCheckboxes);
    setSelectedPreset(presetKey);
    onApplyFilters(nextFilters);
  };

  useEffect(() => {
    applyPreset('moderado');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleToggle = (key: string) => {
    setActiveCheckboxes((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
  };

  const handleValueChange = (key: string, boundType: 'min' | 'max', valStr: string) => {
    setSelectedPreset(null);
    const num = valStr === '' ? null : parseFloat(valStr.replace(',', '.'));

    setFilters((prev) => {
      const current = prev[key] || {};
      const nextBound = { ...current, [boundType]: num };
      return { ...prev, [key]: nextBound };
    });

    // Se o usuário digitou um valor, ativa automaticamente o checkbox do filtro
    if (valStr !== '') {
      setActiveCheckboxes((prev) => ({ ...prev, [key]: true }));
    }
  };

  const handleApply = () => {
    const activeFilters: DaviFilterMap = {};
    Object.entries(filters).forEach(([k, bound]) => {
      if (activeCheckboxes[k] && (bound.min != null || bound.max != null)) {
        activeFilters[k] = bound;
      }
    });
    onApplyFilters(activeFilters);
  };

  const handleClear = () => {
    setFilters({});
    setActiveCheckboxes({});
    setSelectedPreset(null);
    onClearFilters();
  };

  const activeCount = Object.keys(activeCheckboxes).filter(
    (k) => activeCheckboxes[k] && (filters[k]?.min != null || filters[k]?.max != null)
  ).length;

  return (
    <aside
      aria-label="Painel de Filtros do Método DAVI"
      className={cn(
        'relative flex shrink-0 flex-col rounded-2xl border border-slate-800 bg-obsidian-950/90 transition-all duration-200',
        isCollapsed ? 'w-12 items-center p-2' : 'w-full lg:w-64 xl:w-72 p-3 sm:p-3.5'
      )}
    >
      {/* Botão Retrátil */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expandir filtros do Método DAVI' : 'Recolher painel de filtros'}
        aria-label={isCollapsed ? 'Expandir filtros' : 'Recolher filtros'}
        className="absolute -right-3 top-5 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-obsidian-900 text-slate-300 shadow-md hover:bg-obsidian-800 hover:text-white lg:flex"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {isCollapsed ? (
        <div className="flex flex-col items-center gap-4 py-3">
          <Filter className="h-5 w-5 text-emerald-400" />
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-extrabold text-obsidian-950">
              {activeCount}
            </span>
          )}
          <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-bold uppercase tracking-wider text-slate-400">
            Método DAVI
          </span>
        </div>
      ) : (
        <div className="flex h-full flex-col space-y-4">
          {/* Header da Barra Lateral */}
          <div className="border-b border-slate-800/80 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                <h2 className="text-base font-extrabold text-white">Método DAVI</h2>
                {activeCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-extrabold text-obsidian-950">
                    {activeCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {filteredCount} de {totalAssets}
              </span>
            </div>
          </div>

          {/* Seção Perfil de Investidor */}
          <div className="space-y-2">
            <span className="block text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Perfil de Investidor
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {(Object.keys(PRESETS) as DaviProfileKey[]).map((key) => {
                const preset = PRESETS[key];
                const Icon = preset.icon;
                const isSelected = selectedPreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    title={preset.description}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition sm:text-sm',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-obsidian-950 shadow-md shadow-emerald-500/20'
                        : 'border-slate-800 bg-obsidian-900/80 text-slate-200 hover:border-slate-700 hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isSelected ? 'text-obsidian-950' : 'text-slate-400')} />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Grupos de Filtros Fundamentalistas */}
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {Object.entries(currentGroups).map(([groupTitle, defs]) => (
              <div key={groupTitle} className="space-y-2 rounded-xl border border-slate-800/80 bg-obsidian-900/50 p-2.5">
                <div className="text-center text-xs font-bold uppercase tracking-wide text-slate-300">
                  {groupTitle}
                </div>
                <div className="space-y-2">
                  {defs.map((def) => {
                    const bound = filters[def.key] || {};
                    const isChecked = Boolean(activeCheckboxes[def.key]);
                    return (
                      <div key={def.key} className="space-y-1 text-xs">
                        <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-200 hover:text-white">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(def.key)}
                            className="h-3.5 w-3.5 rounded border-slate-700 bg-obsidian-950 accent-emerald-500"
                          />
                          <span className="truncate">{def.label}</span>
                        </label>

                        <div className="flex items-center gap-1.5 pl-5">
                          {(def.type === 'min' || def.type === 'range') && (
                            <input
                              type="number"
                              step={def.step ?? 0.5}
                              placeholder="Min"
                              value={bound.min ?? ''}
                              onChange={(e) => handleValueChange(def.key, 'min', e.target.value)}
                              className="h-7 w-full rounded border border-slate-800 bg-obsidian-950 px-2 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                            />
                          )}
                          {(def.type === 'max' || def.type === 'range') && (
                            <input
                              type="number"
                              step={def.step ?? 0.5}
                              placeholder="Max"
                              value={bound.max ?? ''}
                              onChange={(e) => handleValueChange(def.key, 'max', e.target.value)}
                              className="h-7 w-full rounded border border-slate-800 bg-obsidian-950 px-2 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Botões de Ação no Rodapé */}
          <div className="border-t border-slate-800/80 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-obsidian-900 px-3 text-xs font-bold text-slate-200 transition hover:bg-obsidian-800 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-extrabold text-obsidian-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                <Filter className="h-3.5 w-3.5" />
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
