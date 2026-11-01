'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, CheckCircle2, ChevronDown } from 'lucide-react';
import { Input, Badge } from '@/components/ui/primitives';
import {
  SEED_CATALOG_ASSETS,
  resolveAssetDisplayName,
  resolveAssetSector
} from '@/lib/asset-names';
import { formatBRL, formatUSD } from '@/lib/money';
import { cn } from '@/lib/utils';

export interface CatalogAssetOption {
  code: string;
  name: string;
  category: string;
  market: string;
  sector: string | null;
  price: number;
}

interface AssetAutocompleteInputProps {
  id?: string;
  value: string;
  categoryFilter?: string;
  placeholder?: string;
  required?: boolean;
  onChange: (code: string) => void;
  onSelectAsset?: (asset: CatalogAssetOption) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  acoes: 'Ação BR',
  fiis: 'FII BR',
  fixed: 'Renda Fixa',
  stocks: 'Stock EUA',
  reits: 'REIT EUA'
};

const INITIAL_SEED_OPTIONS: CatalogAssetOption[] = SEED_CATALOG_ASSETS.map((item) => ({
  code: item.code,
  name: item.name,
  category: item.category,
  market: item.market,
  sector: item.sector || null,
  price: 0
}));

export function AssetAutocompleteInput({
  id = 'tx-ticker',
  value,
  categoryFilter,
  placeholder = 'Digite o código ou empresa (ex: WEGE3, HGLG11, Tesouro Selic)',
  required = true,
  onChange,
  onSelectAsset
}: AssetAutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Carrega catálogo completo (1.524 ativos) do PostgreSQL e mescla com o catálogo semente 0ms
  const { data: remoteCatalog = [] } = useQuery<CatalogAssetOption[]>({
    queryKey: ['assets-catalog-autocomplete'],
    queryFn: async () => {
      const res = await fetch('/api/radar?limit=1600');
      if (!res.ok) return [];
      const json = await res.json();
      return (json.items || []) as CatalogAssetOption[];
    },
    staleTime: 10 * 60 * 1000
  });

  const catalog = useMemo<CatalogAssetOption[]>(() => {
    const merged = new Map<string, CatalogAssetOption>();

    for (const seed of INITIAL_SEED_OPTIONS) {
      merged.set(seed.code.toUpperCase(), seed);
    }

    for (const item of remoteCatalog) {
      const upper = item.code.toUpperCase();
      merged.set(upper, {
        ...item,
        name: resolveAssetDisplayName(item.code, item.name),
        sector: resolveAssetSector(item.code, item.sector)
      });
    }

    return Array.from(merged.values());
  }, [remoteCatalog]);

  // Fecha a lista ao clicar fora
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();

    const filterMatches = (items: CatalogAssetOption[]) => {
      if (!q) {
        return [...items]
          .sort((a, b) => a.code.localeCompare(b.code))
          .slice(0, 30);
      }

      return items
        .filter(
          (a) =>
            a.code.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            (a.sector || '').toLowerCase().includes(q)
        )
        .sort((a, b) => {
          const aCode = a.code.toLowerCase();
          const bCode = b.code.toLowerCase();
          if (aCode === q && bCode !== q) return -1;
          if (bCode === q && aCode !== q) return 1;

          const aStarts = aCode.startsWith(q);
          const bStarts = bCode.startsWith(q);
          if (aStarts && !bStarts) return -1;
          if (bStarts && !aStarts) return 1;

          const aNameStarts = a.name.toLowerCase().startsWith(q);
          const bNameStarts = b.name.toLowerCase().startsWith(q);
          if (aNameStarts && !bNameStarts) return -1;
          if (bNameStarts && !aNameStarts) return 1;

          return a.code.localeCompare(b.code);
        })
        .slice(0, 25);
    };

    if (categoryFilter && categoryFilter !== 'all') {
      const scoped = catalog.filter((a) => a.category === categoryFilter);
      const scopedResults = filterMatches(scoped);
      // Se o investidor digitou um código de outra classe (ex: digitou HGLG11 estando em Ações), busca no catálogo geral
      if (scopedResults.length > 0 || !q) {
        return scopedResults;
      }
    }

    return filterMatches(catalog);
  }, [catalog, categoryFilter, value]);

  const exactSelected = useMemo(() => {
    const clean = value.trim().toUpperCase();
    if (!clean) return null;
    return catalog.find((a) => a.code.toUpperCase() === clean) || null;
  }, [catalog, value]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [value, categoryFilter]);

  const handlePick = (asset: CatalogAssetOption) => {
    onChange(asset.code);
    onSelectAsset?.(asset);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      const target = suggestions[highlightedIndex];
      if (target) {
        e.preventDefault();
        handlePick(target);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
        <Input
          id={id}
          required={required}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value.toUpperCase());
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-9 font-semibold uppercase"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Abrir lista de ativos"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-2.5 rounded p-0.5 text-slate-400 hover:text-white"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Confirmação visual do nome do ativo identificado */}
      {exactSelected && !isOpen && (
        <div className="mt-1.5 flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
          <span className="flex items-center gap-1.5 truncate font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <strong className="text-white">{exactSelected.code}</strong>
            {exactSelected.name.toUpperCase() !== exactSelected.code.toUpperCase() && (
              <span className="truncate text-slate-200">— {exactSelected.name}</span>
            )}
          </span>
          {exactSelected.price > 0 && (
            <span className="money-value ml-2 shrink-0 text-slate-300">
              {exactSelected.market === 'US'
                ? formatUSD(exactSelected.price)
                : formatBRL(exactSelected.price)}
            </span>
          )}
        </div>
      )}

      {/* Lista Dropdown de Autocomplete com Código + Nome do Ativo */}
      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Sugestões de ativos"
          className="absolute left-0 right-0 z-[70] mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-gold-500/35 bg-[#0B0F1A] p-1.5 shadow-2xl"
        >
          {suggestions.map((asset, index) => {
            const isHighlighted = index === highlightedIndex;
            const hasDistinctName = asset.name.toUpperCase() !== asset.code.toUpperCase();
            return (
              <li
                key={asset.code}
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(e) => {
                  // Evita perder o foco antes do clique
                  e.preventDefault();
                  handlePick(asset);
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs transition',
                  isHighlighted
                    ? 'bg-gold-500/15 text-white'
                    : 'text-slate-300 hover:bg-obsidian-800'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold tracking-wide text-gold-400">
                      {asset.code}
                    </span>
                    {hasDistinctName && (
                      <span className="truncate font-medium text-slate-100">
                        — {asset.name}
                      </span>
                    )}
                  </div>
                  {asset.sector && (
                    <span className="block truncate text-[10px] text-slate-400">
                      {asset.sector}
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {asset.price > 0 && (
                    <span className="money-value text-[11px] font-semibold text-emerald-400">
                      {asset.market === 'US' ? formatUSD(asset.price) : formatBRL(asset.price)}
                    </span>
                  )}
                  <Badge tone="slate" className="text-[10px]">
                    {CATEGORY_LABELS[asset.category] || asset.category}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
