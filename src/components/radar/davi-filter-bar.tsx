'use client';

import React from 'react';
import { RotateCcw, Shield, Star, TrendingUp, Zap } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

export type DaviProfileKey = 'none' | 'conservador' | 'moderado' | 'flexivel';

export interface DaviFilterState {
  profile: DaviProfileKey;
  onlyFavorites: boolean;
  maxPe: string;
  maxPvp: string;
  minDy: string;
  minRoe: string;
  maxVacancy: string;
}

export const EMPTY_DAVI_FILTERS: DaviFilterState = {
  profile: 'none',
  onlyFavorites: false,
  maxPe: '',
  maxPvp: '',
  minDy: '',
  minRoe: '',
  maxVacancy: ''
};

export interface FilterableRadarAsset {
  category: string;
  peRatio: number | null;
  pbRatio: number | null;
  pVpa: number | null;
  dividendYield: number | null;
  roe: number | null;
  vacancyRate: number | null;
  userRating: number | null;
}

export function buildDaviPresetFilters(
  profile: Exclude<DaviProfileKey, 'none'>,
  categoryFilter: string
): DaviFilterState {
  const isFii = categoryFilter === 'fii' || categoryFilter === 'fiis';
  const isStock = categoryFilter === 'stock' || categoryFilter === 'stocks';
  const isReit = categoryFilter === 'reit' || categoryFilter === 'reits';

  if (profile === 'conservador') {
    if (isFii) {
      return { profile, onlyFavorites: false, maxPe: '', maxPvp: '1.05', minDy: '8', minRoe: '', maxVacancy: '8' };
    }
    if (isStock) {
      return { profile, onlyFavorites: false, maxPe: '25', maxPvp: '5', minDy: '1', minRoe: '15', maxVacancy: '' };
    }
    if (isReit) {
      return { profile, onlyFavorites: false, maxPe: '', maxPvp: '1.2', minDy: '3.5', minRoe: '', maxVacancy: '8' };
    }
    return { profile, onlyFavorites: false, maxPe: '12', maxPvp: '2', minDy: '4', minRoe: '15', maxVacancy: '' };
  }

  if (profile === 'moderado') {
    if (isFii) {
      return { profile, onlyFavorites: false, maxPe: '', maxPvp: '1.15', minDy: '7', minRoe: '', maxVacancy: '12' };
    }
    if (isStock) {
      return { profile, onlyFavorites: false, maxPe: '35', maxPvp: '8', minDy: '0.5', minRoe: '12', maxVacancy: '' };
    }
    if (isReit) {
      return { profile, onlyFavorites: false, maxPe: '', maxPvp: '1.35', minDy: '3', minRoe: '', maxVacancy: '10' };
    }
    return { profile, onlyFavorites: false, maxPe: '15', maxPvp: '3', minDy: '3', minRoe: '10', maxVacancy: '' };
  }

  // flexivel
  if (isFii) {
    return { profile, onlyFavorites: false, maxPe: '', maxPvp: '1.25', minDy: '5', minRoe: '', maxVacancy: '15' };
  }
  if (isStock) {
    return { profile, onlyFavorites: false, maxPe: '45', maxPvp: '', minDy: '', minRoe: '10', maxVacancy: '' };
  }
  if (isReit) {
    return { profile, onlyFavorites: false, maxPe: '', maxPvp: '1.5', minDy: '2.5', minRoe: '', maxVacancy: '15' };
  }
  return { profile, onlyFavorites: false, maxPe: '22', maxPvp: '5', minDy: '2', minRoe: '8', maxVacancy: '' };
}

export function matchesDaviFilters(item: FilterableRadarAsset, filters: DaviFilterState): boolean {
  if (filters.onlyFavorites && (item.userRating ?? 0) < 4) return false;
  if (item.category === 'fixed') return true;

  if (filters.maxPe !== '') {
    const maxPe = Number(filters.maxPe);
    if (Number.isFinite(maxPe) && (item.category === 'acoes' || item.category === 'stocks')) {
      if (item.peRatio === null || item.peRatio <= 0 || item.peRatio > maxPe) return false;
    }
  }

  if (filters.maxPvp !== '') {
    const maxPvp = Number(filters.maxPvp);
    const pvp = item.pVpa ?? item.pbRatio;
    if (Number.isFinite(maxPvp)) {
      if (pvp === null || pvp <= 0 || pvp > maxPvp) return false;
    }
  }

  if (filters.minDy !== '') {
    const minDy = Number(filters.minDy);
    if (Number.isFinite(minDy)) {
      if (item.dividendYield === null || item.dividendYield < minDy) return false;
    }
  }

  if (filters.minRoe !== '') {
    const minRoe = Number(filters.minRoe);
    if (Number.isFinite(minRoe) && (item.category === 'acoes' || item.category === 'stocks')) {
      if (item.roe === null || item.roe < minRoe) return false;
    }
  }

  if (filters.maxVacancy !== '') {
    const maxVac = Number(filters.maxVacancy);
    if (Number.isFinite(maxVac) && (item.category === 'fiis' || item.category === 'reits')) {
      if (item.vacancyRate !== null && item.vacancyRate > maxVac) return false;
    }
  }

  return true;
}

interface DaviFilterBarProps {
  filters: DaviFilterState;
  categoryFilter: string;
  matchedCount: number;
  totalCount: number;
  onChange: (next: DaviFilterState) => void;
}

export function DaviFilterBar({
  filters,
  categoryFilter,
  matchedCount,
  totalCount,
  onChange
}: DaviFilterBarProps) {
  const hasActiveFilter =
    filters.onlyFavorites ||
    filters.maxPe !== '' ||
    filters.maxPvp !== '' ||
    filters.minDy !== '' ||
    filters.minRoe !== '' ||
    filters.maxVacancy !== '';

  return (
    <Card className="space-y-4 border-gold-500/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-white sm:text-lg">
            Filtros Fundamentalistas — Filtro MFS
          </h2>
          <p className="text-sm text-slate-200">
            Peneire empresas e fundos pelos fundamentos, avalie com estrelas (★) e envie suas
            escolhas direto para <strong className="text-gold-300">Meus Objetivos</strong>.
          </p>
        </div>

        <span className="rounded-xl border border-emerald-400/40 bg-[#081a14] px-3.5 py-1.5 text-sm font-extrabold text-emerald-200">
          {matchedCount} de {totalCount} ativos aprovados
        </span>
      </div>

      {/* Perfis Rápidos de Rigor Fundamentalista */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => onChange(buildDaviPresetFilters('conservador', categoryFilter))}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition',
            filters.profile === 'conservador'
              ? 'border-emerald-400 bg-emerald-500/20 text-white'
              : 'border-slate-700 bg-obsidian-950 text-slate-200 hover:border-gold-400/50 hover:text-white'
          )}
        >
          <Shield className="h-4 w-4 text-emerald-400" />
          Rigor Conservador
        </button>

        <button
          type="button"
          onClick={() => onChange(buildDaviPresetFilters('moderado', categoryFilter))}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition',
            filters.profile === 'moderado'
              ? 'border-gold-400 bg-gold-500/20 text-white'
              : 'border-slate-700 bg-obsidian-950 text-slate-200 hover:border-gold-400/50 hover:text-white'
          )}
        >
          <TrendingUp className="h-4 w-4 text-gold-400" />
          Equilíbrio Moderado
        </button>

        <button
          type="button"
          onClick={() => onChange(buildDaviPresetFilters('flexivel', categoryFilter))}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition',
            filters.profile === 'flexivel'
              ? 'border-sky-400 bg-sky-500/20 text-white'
              : 'border-slate-700 bg-obsidian-950 text-slate-200 hover:border-gold-400/50 hover:text-white'
          )}
        >
          <Zap className="h-4 w-4 text-sky-400" />
          Flexível / Crescimento
        </button>

        <button
          type="button"
          onClick={() =>
            onChange({ ...filters, onlyFavorites: !filters.onlyFavorites })
          }
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition',
            filters.onlyFavorites
              ? 'border-gold-400 bg-gold-500/25 text-gold-200'
              : 'border-slate-700 bg-obsidian-950 text-slate-200 hover:border-gold-400/50 hover:text-white'
          )}
        >
          <Star className="h-4 w-4 text-gold-400" />
          Meus Favoritos (4★ e 5★)
        </button>

        {hasActiveFilter && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => onChange(EMPTY_DAVI_FILTERS)}
            className="text-sm font-bold text-rose-300 hover:text-rose-200"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Ajuste Fino Individual dos Indicadores */}
      <div className="grid gap-3 border-t border-slate-800 pt-3.5 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="davi-max-pe" className="mb-1 block text-xs font-bold text-slate-200 sm:text-sm">
            P/L Máximo
          </label>
          <Input
            id="davi-max-pe"
            type="number"
            step="0.5"
            min="0"
            placeholder="Ex: 15"
            value={filters.maxPe}
            onChange={(e) => onChange({ ...filters, profile: 'none', maxPe: e.target.value })}
            className="h-10 text-sm font-bold"
          />
        </div>

        <div>
          <label htmlFor="davi-max-pvp" className="mb-1 block text-xs font-bold text-slate-200 sm:text-sm">
            P/VP Máximo
          </label>
          <Input
            id="davi-max-pvp"
            type="number"
            step="0.05"
            min="0"
            placeholder="Ex: 1.15"
            value={filters.maxPvp}
            onChange={(e) => onChange({ ...filters, profile: 'none', maxPvp: e.target.value })}
            className="h-10 text-sm font-bold"
          />
        </div>

        <div>
          <label htmlFor="davi-min-dy" className="mb-1 block text-xs font-bold text-slate-200 sm:text-sm">
            Dividend Yield Mín. (%)
          </label>
          <Input
            id="davi-min-dy"
            type="number"
            step="0.5"
            min="0"
            placeholder="Ex: 6"
            value={filters.minDy}
            onChange={(e) => onChange({ ...filters, profile: 'none', minDy: e.target.value })}
            className="h-10 text-sm font-bold"
          />
        </div>

        <div>
          <label htmlFor="davi-min-roe" className="mb-1 block text-xs font-bold text-slate-200 sm:text-sm">
            ROE Mínimo (%)
          </label>
          <Input
            id="davi-min-roe"
            type="number"
            step="1"
            min="0"
            placeholder="Ex: 12"
            value={filters.minRoe}
            onChange={(e) => onChange({ ...filters, profile: 'none', minRoe: e.target.value })}
            className="h-10 text-sm font-bold"
          />
        </div>

        <div>
          <label htmlFor="davi-max-vac" className="mb-1 block text-xs font-bold text-slate-200 sm:text-sm">
            Vacância Máx. FII/REIT (%)
          </label>
          <Input
            id="davi-max-vac"
            type="number"
            step="1"
            min="0"
            placeholder="Ex: 10"
            value={filters.maxVacancy}
            onChange={(e) => onChange({ ...filters, profile: 'none', maxVacancy: e.target.value })}
            className="h-10 text-sm font-bold"
          />
        </div>
      </div>
    </Card>
  );
}
