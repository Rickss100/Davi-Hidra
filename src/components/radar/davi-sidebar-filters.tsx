'use client';

import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Save,
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

export type DaviFilterValue = FilterBound | boolean | undefined;

export type DaviFilterMap = {
  [key: string]: DaviFilterValue;
  only_novo_mercado?: boolean | FilterBound;
  only_best_sectors?: boolean | FilterBound;
  only_multi_property?: boolean | FilterBound;
  smart_fii_pvp?: boolean | FilterBound;
  only_etfs?: boolean | FilterBound;
};

export interface FilterDefinition {
  key: string;
  label: string;
  type: 'min' | 'max' | 'range' | 'boolean';
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
    description: 'Filtros rigorosos para máxima segurança: empresas perenes dos setores BEST e FIIs multiativos',
    filters: {
      acoes: {
        only_best_sectors: { min: 1, max: 1 },
        pe_ratio: { min: 0.01, max: 18 },
        dividend_yield: { min: 3.5 },
        roe: { min: 11 },
        net_debt_ebitda: { max: 3.5 }
      },
      fiis: {
        only_multi_property: { min: 1, max: 1 },
        smart_fii_pvp: { min: 1, max: 1 },
        p_vpa: { min: 0.80, max: 1.08 },
        dividend_yield: { min: 7.5 },
        vacancy_rate: { max: 10 }
      },
      stocks: {
        pe_ratio: { min: 0.01, max: 30 },
        dividend_yield: { min: 1.5 },
        roe: { min: 12 }
      },
      reits: {
        pe_ratio: { min: 0.01, max: 20 },
        p_vpa: { max: 1.15 },
        dividend_yield: { min: 4.0 },
        vacancy_rate: { max: 8 }
      },
      fixed: {
        dividend_yield: { min: 9 }
      }
    }
  },
  moderado: {
    name: 'Moderado',
    icon: TrendingUp,
    description: 'Equilíbrio padrão ouro entre governança, dividendos recorrentes e valuation atrativo',
    filters: {
      acoes: {
        pe_ratio: { min: 0.01, max: 25 },
        dividend_yield: { min: 2.0 },
        roe: { min: 10 },
        net_debt_ebitda: { max: 4.0 }
      },
      fiis: {
        smart_fii_pvp: { min: 1, max: 1 },
        p_vpa: { min: 0.75, max: 1.15 },
        dividend_yield: { min: 6.0 },
        vacancy_rate: { max: 12 }
      },
      stocks: {
        pe_ratio: { min: 0.01, max: 38 },
        dividend_yield: { min: 0.5 },
        roe: { min: 10 }
      },
      reits: {
        pe_ratio: { min: 0.01, max: 24 },
        p_vpa: { max: 1.25 },
        dividend_yield: { min: 3.5 }
      },
      fixed: {
        dividend_yield: { min: 10 }
      }
    }
  },
  agressivo: {
    name: 'Agressivo',
    icon: Zap,
    description: 'Ampla convexidade: captura gigantes de tecnologia e crescimento acelerado com alto ROIC (ex: WEGE3)',
    filters: {
      acoes: {
        pe_ratio: { min: 0.01, max: 45 },
        roe: { min: 8 }
      },
      fiis: {
        p_vpa: { min: 0.70, max: 1.30 },
        dividend_yield: { min: 4.0 }
      },
      stocks: {
        pe_ratio: { min: 0.01, max: 55 },
        roe: { min: 10 }
      },
      reits: {
        pe_ratio: { min: 0.01, max: 30 },
        dividend_yield: { min: 2.0 }
      },
      fixed: {
        dividend_yield: { min: 10 }
      }
    }
  }
};

export const FILTER_GROUPS: Record<string, Record<string, FilterDefinition[]>> = {
  acoes: {
    '🏛️ Governança & Setor (Filtro MFS)': [
      { key: 'only_novo_mercado', label: '🛡️ Novo Mercado / Tag Along 100%', type: 'boolean' },
      { key: 'only_best_sectors', label: '⚡ Setores Perenes (BEST)', type: 'boolean' }
    ],
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
    '🏢 Governança & Imóveis': [
      { key: 'only_multi_property', label: '🏢 Apenas Multiativo (> 5 Imóveis)', type: 'boolean' },
      { key: 'smart_fii_pvp', label: '🎯 P/VP Inteligente (Papel máx 1,02)', type: 'boolean' }
    ],
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
    '🌍 Veículo de Acesso': [
      { key: 'only_etfs', label: '🌍 Apenas ETFs Globais (VOO, VT...)', type: 'boolean' }
    ],
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


export interface SavedFilterMemory {
  id: number;
  name: string;
  filters: DaviFilterMap;
  checkboxes: Record<string, boolean>;
  category: string;
  savedAt: string;
}

const STORAGE_KEY_MEMORIES = 'mantfrai_radar_filter_memories_v2';

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
  const [memories, setMemories] = useState<Record<number, SavedFilterMemory>>({});
  const [activeMemoryId, setActiveMemoryId] = useState<number | null>(null);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [targetSlot, setTargetSlot] = useState<number>(1);
  const [memoryLabel, setMemoryLabel] = useState<string>('');
  const [memoryFeedback, setMemoryFeedback] = useState<string>('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MEMORIES);
      if (stored) {
        setMemories(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleSaveToMemory = (slot: number, customName?: string) => {
    const name = customName?.trim() || `Memória M${slot}`;
    const newMemory: SavedFilterMemory = {
      id: slot,
      name,
      filters: { ...filters },
      checkboxes: { ...activeCheckboxes },
      category: normalizedCategory,
      savedAt: new Date().toLocaleDateString('pt-BR')
    };

    const nextMemories = { ...memories, [slot]: newMemory };
    setMemories(nextMemories);
    setActiveMemoryId(slot);
    setSelectedPreset(null);
    try {
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(nextMemories));
    } catch {}

    setMemoryFeedback(`✓ Filtros salvos no slot M${slot}!`);
    setIsSavingMemory(false);
    setMemoryLabel('');
    setTimeout(() => setMemoryFeedback(''), 3000);
  };

  const handleLoadMemory = (slot: number) => {
    const mem = memories[slot];
    if (!mem) {
      setTargetSlot(slot);
      setMemoryLabel(`Minha Estratégia M${slot}`);
      setIsSavingMemory(true);
      return;
    }

    setFilters(mem.filters);
    setActiveCheckboxes(mem.checkboxes || {});
    setActiveMemoryId(slot);
    setSelectedPreset(null);
    onApplyFilters(mem.filters);
    setMemoryFeedback(`✓ M${slot} carregada: ${mem.name}`);
    setTimeout(() => setMemoryFeedback(''), 2500);
  };


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

  const handleToggle = (key: string, isBoolean = false) => {
    setSelectedPreset(null);
    setActiveCheckboxes((prev) => {
      const nextChecked = !prev[key];
      const next = { ...prev, [key]: nextChecked };

      if (isBoolean) {
        setFilters((prevFilters) => {
          if (nextChecked) {
            return { ...prevFilters, [key]: { min: 1, max: 1 } };
          } else {
            const copy = { ...prevFilters };
            delete copy[key];
            return copy;
          }
        });
      }

      return next;
    });
  };

  const handleValueChange = (key: string, boundType: 'min' | 'max', valStr: string) => {
    setSelectedPreset(null);
    const num = valStr === '' ? null : parseFloat(valStr.replace(',', '.'));

    setFilters((prev) => {
      const rawCurrent = prev[key];
      const current: FilterBound = (typeof rawCurrent === 'object' && rawCurrent !== null) ? rawCurrent : {};
      const nextBound: FilterBound = { ...current, [boundType]: num };
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
      if (activeCheckboxes[k]) {
        if (typeof bound === 'boolean') {
          if (bound) activeFilters[k] = true;
        } else if (bound && typeof bound === 'object' && (bound.min != null || bound.max != null)) {
          activeFilters[k] = bound;
        }
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

  const activeCount = Object.keys(activeCheckboxes).filter((k) => {
    if (!activeCheckboxes[k]) return false;
    const b = filters[k];
    if (typeof b === 'boolean') return b;
    return b && typeof b === 'object' && (b.min != null || b.max != null);
  }).length;

  return (
    <aside
      aria-label="Painel de Filtros do Radar MFS"
      className={cn(
        'relative flex shrink-0 flex-col rounded-2xl border border-slate-800 bg-obsidian-950/90 transition-all duration-200',
        isCollapsed ? 'w-12 items-center p-2' : 'w-full lg:w-64 xl:w-72 p-3 sm:p-3.5'
      )}
    >
      {/* Botão Retrátil */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expandir filtros do Radar MFS' : 'Recolher painel de filtros'}
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
            Filtro MFS
          </span>
        </div>
      ) : (
        <div className="flex h-full flex-col space-y-4">
          {/* Header da Barra Lateral */}
          <div className="border-b border-slate-800/80 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                <h2 className="text-base font-extrabold text-white">Filtro MFS</h2>
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

          {/* Seção Minhas Memórias Rápidas (M1 a M5) */}
          <div className="space-y-2 rounded-xl border border-gold-500/35 bg-obsidian-950/80 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold-400">
                <Bookmark className="h-3.5 w-3.5" />
                Minhas Memórias
              </span>
              <button
                type="button"
                onClick={() => {
                  setTargetSlot(activeMemoryId || 1);
                  setMemoryLabel(memories[activeMemoryId || 1]?.name || `Minha Estratégia M${activeMemoryId || 1}`);
                  setIsSavingMemory(!isSavingMemory);
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-gold-300 transition hover:text-gold-200 hover:underline"
                title="Gravar configuração atual de filtros em um dos 5 slots de memória"
              >
                <Save className="h-3 w-3" />
                Salvar Atual
              </button>
            </div>

            {/* Grid dos 5 Slots de Memória (M1 a M5) */}
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((slot) => {
                const mem = memories[slot];
                const hasSaved = Boolean(mem);
                const isActive = activeMemoryId === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleLoadMemory(slot)}
                    title={
                      mem
                        ? `M${slot}: ${mem.name} (Salvo em ${mem.savedAt}). Clique para carregar.`
                        : `Slot M${slot} vazio. Clique para salvar o filtro atual aqui.`
                    }
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-lg border py-2 text-xs font-black transition',
                      isActive
                        ? 'border-gold-400 bg-gold-500 text-obsidian-950 shadow-md shadow-gold-500/30'
                        : hasSaved
                          ? 'border-gold-500/50 bg-obsidian-900 text-gold-300 hover:border-gold-400 hover:bg-gold-500/10'
                          : 'border-dashed border-slate-700/80 bg-obsidian-950/50 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                    )}
                  >
                    <span>M{slot}</span>
                    {hasSaved && (
                      <span
                        className={cn(
                          'mt-0.5 h-1.5 w-1.5 rounded-full',
                          isActive ? 'bg-obsidian-950' : 'bg-gold-400'
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Painel Expansível de Gravação de Memória */}
            {isSavingMemory && (
              <div className="mt-2 space-y-2 rounded-lg border border-gold-500/40 bg-obsidian-900 p-2.5 shadow-xl">
                <div className="text-xs font-bold text-white">
                  Salvar filtro atual em qual slot?
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setTargetSlot(s);
                          if (!memoryLabel || memoryLabel.startsWith('Minha Estratégia M')) {
                            setMemoryLabel(memories[s]?.name || `Minha Estratégia M${s}`);
                          }
                        }}
                        className={cn(
                          'h-7 w-7 rounded font-extrabold text-xs transition',
                          targetSlot === s
                            ? 'bg-gold-500 text-obsidian-950'
                            : 'bg-obsidian-950 border border-slate-700 text-slate-300'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={memoryLabel}
                    onChange={(e) => setMemoryLabel(e.target.value)}
                    placeholder="Nome do filtro..."
                    maxLength={28}
                    className="h-7 flex-1 rounded border border-slate-700 bg-obsidian-950 px-2 text-xs text-white placeholder-slate-500 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsSavingMemory(false)}
                    className="rounded px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveToMemory(targetSlot, memoryLabel)}
                    className="rounded bg-gold-500 px-2.5 py-1 text-[11px] font-extrabold text-obsidian-950 hover:bg-gold-400"
                  >
                    Gravar M{targetSlot}
                  </button>
                </div>
              </div>
            )}

            {memoryFeedback && (
              <div className="text-[11px] font-bold text-emerald-300">
                {memoryFeedback}
              </div>
            )}
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
                    const rawBound = filters[def.key];
                    const bound: FilterBound =
                      typeof rawBound === 'object' && rawBound !== null ? rawBound : {};
                    const isChecked = Boolean(activeCheckboxes[def.key]);
                    return (
                      <div key={def.key} className="space-y-1 text-xs">
                        <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-200 hover:text-white">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(def.key, def.type === 'boolean')}
                            className="h-3.5 w-3.5 rounded border-slate-700 bg-obsidian-950 accent-emerald-500"
                          />
                          <span className="truncate">{def.label}</span>
                        </label>

                        {def.type === 'boolean' ? (
                          <div className="pl-5 text-[10px] font-semibold text-emerald-400">
                            {isChecked ? '✓ Ativo no Radar' : 'Desativado'}
                          </div>
                        ) : (
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
                        )}
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
