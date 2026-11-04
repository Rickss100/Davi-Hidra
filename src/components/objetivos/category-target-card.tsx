'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Compass, Plus, Scale, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui/primitives';
import { AssetTickerLink } from '@/components/ui/asset-ticker-link';
import { AssetAutocompleteInput } from '@/components/portfolio/asset-autocomplete-input';
import { resolveAssetDisplayName, resolveAssetSector } from '@/lib/asset-names';
import { formatPercent } from '@/lib/money';
import type { AssetTargetItem, AssetTargetsConfig } from '@/db/schema';

export type EditableTargetCategory = Exclude<keyof AssetTargetsConfig, 'reserva'>;

interface CategoryTargetCardProps {
  categoryKey: EditableTargetCategory;
  title: string;
  radarTypeSlug: string;
  effectivePortfolioPercent: number;
  items: AssetTargetItem[];
  onChangeItems: (nextItems: AssetTargetItem[]) => void;
  onEqualizeWeights: () => void;
}

export function CategoryTargetCard({
  categoryKey,
  title,
  radarTypeSlug,
  effectivePortfolioPercent,
  items,
  onChangeItems,
  onEqualizeWeights
}: CategoryTargetCardProps) {
  const [searchCode, setSearchCode] = useState('');

  const sum = items.reduce((acc, item) => acc + Number(item.target || 0), 0);
  const isClassActive = effectivePortfolioPercent > 0;

  const handleAddCode = (rawCode: string, rawSector?: string | null) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    if (items.some((i) => i.code.toUpperCase() === code)) {
      setSearchCode('');
      return;
    }

    const sector = rawSector || resolveAssetSector(code, null) || undefined;
    const defaultWeight = items.length === 0 ? 100 : Math.max(5, Math.round(100 / (items.length + 1)));
    onChangeItems([...items, { code, sector, target: defaultWeight }]);
    setSearchCode('');
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold text-white sm:text-lg">{title}</h3>
            <Badge tone={isClassActive ? 'sky' : 'slate'} className="text-xs font-bold">
              {isClassActive
                ? `${formatPercent(effectivePortfolioPercent)} da carteira`
                : '0% na Divisão Macro'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 1 && (
            <button
              type="button"
              onClick={onEqualizeWeights}
              title="Distribuir 100% igualmente entre os ativos desta classe"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 px-2.5 py-1 text-xs font-bold text-gold-300 transition hover:bg-gold-500/20"
            >
              <Scale className="h-3.5 w-3.5" />
              Dividir Igual (100%)
            </button>
          )}
          <Badge
            tone={sum === 100 || items.length === 0 ? 'emerald' : 'gold'}
            className="px-3 py-1 text-xs font-extrabold sm:text-sm"
          >
            Soma: {sum}%
          </Badge>
        </div>
      </div>

      {/* Autocomplete com Código + Nome Completo filtrado pela classe */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`target-ac-${categoryKey}`} className="sr-only">
            Buscar ativo para adicionar em {title}
          </label>
          <AssetAutocompleteInput
            id={`target-ac-${categoryKey}`}
            value={searchCode}
            categoryFilter={categoryKey}
            required={false}
            placeholder={`Buscar código ou empresa em ${title}...`}
            onChange={setSearchCode}
            onSelectAsset={(asset) => handleAddCode(asset.code, asset.sector)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => handleAddCode(searchCode)}
          className="h-10 shrink-0 text-sm font-bold"
        >
          <Plus className="h-4 w-4" />
          Incluir
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-obsidian-950/60 p-5 text-center">
          <p className="text-sm font-semibold text-slate-200">
            Nenhum ativo escolhido ainda em {title}.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
            Pesquise acima pelo código/nome ou filtre pelos fundamentos no{' '}
            <Link
              href={`/radar?type=${radarTypeSlug}`}
              className="inline-flex items-center gap-1 font-bold text-gold-300 underline-offset-4 hover:underline"
            >
              <Compass className="h-3.5 w-3.5" />
              Radar MFS ({title})
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
          {items.map((item, idx) => {
            const fullName = resolveAssetDisplayName(item.code, null);
            const showFullName = fullName.toUpperCase() !== item.code.toUpperCase();

            return (
              <div
                key={item.code}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-obsidian-950 px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <AssetTickerLink
                    code={item.code}
                    categoryOrType={categoryKey}
                    className="text-sm sm:text-base"
                  />
                  {showFullName && (
                    <span className="block truncate text-xs font-medium text-slate-300 sm:text-sm">
                      {fullName}
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Input
                    aria-label={`Peso alvo de ${item.code}`}
                    type="number"
                    min="0"
                    max="100"
                    value={item.target}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      const copy = [...items];
                      copy[idx] = { ...item, target: val };
                      onChangeItems(copy);
                    }}
                    className="money-value h-9 w-20 text-right text-sm font-extrabold text-white"
                  />
                  <span className="text-sm font-bold text-slate-300">%</span>
                  <button
                    type="button"
                    title={`Remover ${item.code} da meta`}
                    aria-label={`Remover ${item.code} da meta`}
                    onClick={() => onChangeItems(items.filter((_, i) => i !== idx))}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && sum !== 100 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/50 bg-[#191407] px-3.5 py-2.5 text-xs text-amber-100 sm:text-sm">
          <span>
            A soma desta classe está em <strong className="text-amber-300">{sum}%</strong> (o ideal é fechar em{' '}
            <strong className="text-white">100%</strong>).
          </span>
          <button
            type="button"
            onClick={onEqualizeWeights}
            className="font-extrabold text-gold-300 underline-offset-4 hover:underline"
          >
            Ajustar p/ 100% agora
          </button>
        </div>
      )}
    </Card>
  );
}
