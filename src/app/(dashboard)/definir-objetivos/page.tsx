'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Briefcase,
  Compass,
  Globe,
  RotateCcw,
  Save,
  Star
} from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Badge, Button, Card, Input, Skeleton } from '@/components/ui/primitives';
import {
  CategoryTargetCard,
  type EditableTargetCategory
} from '@/components/objetivos/category-target-card';
import {
  distributeEqualTargetWeights,
  EMPTY_ASSET_TARGETS
} from '@/server/engines/davi-hydra.engine';
import { formatPercent } from '@/lib/money';
import type { AssetTargetItem, AssetTargetsConfig, MacroAllocationConfig } from '@/db/schema';

const TARGET_SECTIONS: Array<{
  key: EditableTargetCategory;
  title: string;
  radarTypeSlug: string;
}> = [
  { key: 'acoes', title: 'Ações Brasil', radarTypeSlug: 'acoes' },
  { key: 'fiis', title: 'Fundos Imobiliários (FIIs)', radarTypeSlug: 'fiis' },
  { key: 'fixed', title: 'Renda Fixa', radarTypeSlug: 'fixed' },
  { key: 'stocks', title: 'Stocks (EUA)', radarTypeSlug: 'stocks' },
  { key: 'reits', title: 'REITs (EUA)', radarTypeSlug: 'reits' }
];

function computeEffectiveClassPercent(
  macro: MacroAllocationConfig,
  key: EditableTargetCategory
): number {
  const varFrac = macro.variable / 100;
  const brFrac = macro.brasil / 100;
  const usFrac = macro.usa / 100;
  if (key === 'fixed') return macro.fixed;
  if (key === 'acoes') return Number((varFrac * brFrac * macro.acoes).toFixed(2));
  if (key === 'fiis') return Number((varFrac * brFrac * macro.fiis).toFixed(2));
  if (key === 'stocks') return Number((varFrac * usFrac * macro.stocks).toFixed(2));
  return Number((varFrac * usFrac * macro.reits).toFixed(2));
}

export default function DefinirObjetivosPage() {
  const { data, isLoading, refetch } = usePortfolioData();
  const [macro, setMacro] = useState<MacroAllocationConfig | null>(null);
  const [targets, setTargets] = useState<AssetTargetsConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (data?.snapshot.objectives) {
      setMacro(data.snapshot.objectives.macroAllocation);
      setTargets(data.snapshot.objectives.assetTargets);
    }
  }, [data]);

  if (isLoading || !data || !macro || !targets) {
    return <Skeleton className="h-[520px]" />;
  }

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4500);
  };

  // Aplica EXCLUSIVAMENTE os percentuais Macro (preserva intactos os ativos escolhidos pelo investidor!)
  const applyMacroModel = async (preset: 'brasil' | 'global') => {
    setSaving(true);
    try {
      const res = await fetch('/api/portfolio/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset })
      });
      if (res.ok) {
        await refetch();
        notify(
          preset === 'brasil'
            ? '✓ Modelo Macro 100% Brasil aplicado apenas às porcentagens entre classes (seus ativos não foram alterados)!'
            : '✓ Modelo Macro Global (BR + EUA) aplicado apenas às porcentagens entre classes (seus ativos não foram alterados)!'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustom = async (overrideTargets?: AssetTargetsConfig) => {
    setSaving(true);
    try {
      const res = await fetch('/api/portfolio/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          macroAllocation: macro,
          assetTargets: overrideTargets ?? targets
        })
      });
      if (res.ok) {
        await refetch();
        notify('✓ Sua Régua Patrimonial e escolhas de ativos foram salvas com sucesso!');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImportFromHoldings = async () => {
    const holdings = data.snapshot.holdings;
    const nextTargets: AssetTargetsConfig = {
      ...targets
    };
    let addedCount = 0;

    for (const sec of TARGET_SECTIONS) {
      const catHoldings = holdings[sec.key] || [];
      if (catHoldings.length === 0) continue;

      const currentList = [...(nextTargets[sec.key] || [])];
      for (const h of catHoldings) {
        if (!currentList.some((i) => i.code.toUpperCase() === h.code.toUpperCase())) {
          currentList.push({
            code: h.code,
            sector: h.sector || undefined,
            target: 10
          });
          addedCount++;
        }
      }
      nextTargets[sec.key] = distributeEqualTargetWeights(currentList);
    }

    setTargets(nextTargets);
    await handleSaveCustom(nextTargets);
    notify(
      addedCount > 0
        ? `✓ ${addedCount} ativo(s) da sua custódia importados e distribuídos em 100% por classe!`
        : 'Todos os ativos da sua carteira atual já estão na sua régua de objetivos.'
    );
  };

  const handleImportRadarFavorites = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/radar?minRating=4&limit=500');
      if (!res.ok) return;
      const json = await res.json();
      const favs: Array<{ code: string; category: EditableTargetCategory; sector: string | null }> =
        json.items || [];

      if (favs.length === 0) {
        notify(
          'Você ainda não avaliou ativos com 4★ ou 5★ no Radar MFS. Abra o Radar Fundamentalista para avaliar suas escolhas!'
        );
        return;
      }

      const nextTargets: AssetTargetsConfig = { ...targets };
      let addedCount = 0;

      for (const fav of favs) {
        if (!TARGET_SECTIONS.some((s) => s.key === fav.category)) continue;
        const currentList = [...(nextTargets[fav.category] || [])];
        if (!currentList.some((i) => i.code.toUpperCase() === fav.code.toUpperCase())) {
          currentList.push({
            code: fav.code,
            sector: fav.sector || undefined,
            target: 10
          });
          addedCount++;
        }
        nextTargets[fav.category] = distributeEqualTargetWeights(currentList);
      }

      setTargets(nextTargets);
      await handleSaveCustom(nextTargets);
      notify(
        addedCount > 0
          ? `✓ ${addedCount} favorito(s) avaliados no Radar MFS importados para sua meta!`
          : 'Seus favoritos 4★/5★ do Radar MFS já estão na sua régua.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClearAllTargets = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/portfolio/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearTargets: true })
      });
      if (res.ok) {
        setTargets(EMPTY_ASSET_TARGETS);
        setConfirmClear(false);
        await refetch();
        notify(
          '✓ Lista de ativos limpa! Agora você pode escolher seus próprios ativos pelo Radar MFS ou importar da sua carteira.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const updateCategoryItems = (cat: EditableTargetCategory, nextItems: AssetTargetItem[]) => {
    setTargets({ ...targets, [cat]: nextItems });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Principal */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Objetivos & Régua Patrimonial
          </h1>
          <p className="mt-1 text-sm text-slate-200 sm:text-base">
            1º Defina a divisão percentual entre classes e 2º escolha os seus ativos com apoio do
            Metodologia MANTFRAI.
          </p>
        </div>

        <Button
          type="button"
          variant="gold"
          size="lg"
          onClick={() => handleSaveCustom()}
          disabled={saving}
          className="text-sm font-extrabold sm:text-base"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Salvando...' : 'Salvar Minha Régua'}
        </Button>
      </div>

      {message && (
        <div className="rounded-xl border-2 border-emerald-400/50 bg-[#081a14] p-4 text-sm font-bold text-emerald-200">
          {message}
        </div>
      )}

      {/* PASSO 1: DIVISÃO MACRO ESTRATÉGICA (APENAS PORCENTAGENS ENTRE CLASSES) */}
      <Card className="space-y-5 border-gold-500/30 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white sm:text-xl">
              1. Divisão Macro Estratégica (% entre Classes)
            </h2>
            <p className="mt-1 text-sm text-slate-200">
              Os modelos abaixo ajustam <strong className="text-gold-300">apenas as porcentagens entre classes</strong> — eles{' '}
              <strong className="text-white">não indicam nem alteram os seus ativos</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => applyMacroModel('brasil')}
              disabled={saving}
              className="border-gold-500/40 text-sm font-bold text-slate-100"
            >
              <Award className="h-4 w-4 text-gold-400" />
              Modelo Macro 100% Brasil
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => applyMacroModel('global')}
              disabled={saving}
              className="border-sky-500/40 text-sm font-bold text-slate-100"
            >
              <Globe className="h-4 w-4 text-sky-400" />
              Modelo Macro Global (BR + EUA)
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="m-fixed" className="mb-1.5 block text-sm font-bold text-slate-100">
              Renda Fixa (%) · Variável: {100 - macro.fixed}%
            </label>
            <Input
              id="m-fixed"
              type="number"
              min="0"
              max="100"
              value={macro.fixed}
              onChange={(e) => {
                const f = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                setMacro({ ...macro, fixed: f, variable: 100 - f });
              }}
              className="money-value h-11 text-base font-extrabold text-white"
            />
          </div>

          <div>
            <label htmlFor="m-brasil" className="mb-1.5 block text-sm font-bold text-slate-100">
              Brasil (%) · Exterior EUA: {100 - macro.brasil}%
            </label>
            <Input
              id="m-brasil"
              type="number"
              min="0"
              max="100"
              value={macro.brasil}
              onChange={(e) => {
                const br = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                setMacro({ ...macro, brasil: br, usa: 100 - br });
              }}
              className="money-value h-11 text-base font-extrabold text-white"
            />
          </div>

          <div>
            <label htmlFor="m-acoes" className="mb-1.5 block text-sm font-bold text-slate-100">
              No Brasil: Ações (%) · FIIs: {100 - macro.acoes}%
            </label>
            <Input
              id="m-acoes"
              type="number"
              min="0"
              max="100"
              value={macro.acoes}
              onChange={(e) => {
                const ac = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                setMacro({ ...macro, acoes: ac, fiis: 100 - ac });
              }}
              className="money-value h-11 text-base font-extrabold text-white"
            />
          </div>

          <div>
            <label htmlFor="m-stocks" className="mb-1.5 block text-sm font-bold text-slate-100">
              Nos EUA: Stocks (%) · REITs: {100 - macro.stocks}%
            </label>
            <Input
              id="m-stocks"
              type="number"
              min="0"
              max="100"
              value={macro.stocks}
              onChange={(e) => {
                const st = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                setMacro({ ...macro, stocks: st, reits: 100 - st });
              }}
              className="money-value h-11 text-base font-extrabold text-white"
            />
          </div>
        </div>

        {/* Resumo Visual do Peso Final de Cada Classe na Carteira */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-obsidian-950 p-3.5 text-xs sm:text-sm">
          <span className="font-bold text-slate-300">Peso final na carteira total:</span>
          {TARGET_SECTIONS.map((sec) => {
            const pct = computeEffectiveClassPercent(macro, sec.key);
            return (
              <Badge
                key={sec.key}
                tone={pct > 0 ? 'gold' : 'slate'}
                className="px-3 py-1 text-xs font-extrabold sm:text-sm"
              >
                {sec.title}: {formatPercent(pct)}
              </Badge>
            );
          })}
        </div>
      </Card>

      {/* PASSO 2: ESCOLHA PESSOAL DE ATIVOS (CONECTADA AO FILTRO MFS & CARTEIRA) */}
      <Card className="space-y-4 border-emerald-500/30 bg-[#081713] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-lg font-extrabold text-white sm:text-xl">
              2. Escolha dos Seus Ativos (Autonomia MANTFRAI)
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-100">
              Aqui <strong className="text-emerald-300">nenhum ativo é imposto automaticamente</strong>.
              Filtre empresas e fundos sólidos no{' '}
              <strong className="text-gold-300">Radar Fundamentalista (Filtro MFS)</strong>, importe
              seus favoritos (4★/5★) ou traga os ativos que você já possui em custódia:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Link
            href="/radar"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-extrabold text-obsidian-950 transition hover:bg-emerald-400"
          >
            <Compass className="h-4 w-4" />
            Escolher no Radar MFS
          </Link>

          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={saving}
            onClick={handleImportRadarFavorites}
            className="border-gold-500/40 text-sm font-bold text-slate-100"
          >
            <Star className="h-4 w-4 text-gold-400" />
            Importar Favoritos do Radar (4★ e 5★)
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={saving}
            onClick={handleImportFromHoldings}
            className="border-slate-700 text-sm font-bold text-slate-100"
          >
            <Briefcase className="h-4 w-4 text-sky-400" />
            Importar da Minha Carteira Atual
          </Button>

          {confirmClear ? (
            <div className="inline-flex items-center gap-2">
              <Button
                type="button"
                variant="danger"
                size="md"
                disabled={saving}
                onClick={handleClearAllTargets}
                className="text-sm font-extrabold"
              >
                Confirmar Limpeza
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setConfirmClear(false)}
                className="text-sm"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={saving}
              onClick={() => setConfirmClear(true)}
              className="text-sm font-bold text-rose-300 hover:text-rose-200"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar Lista de Ativos
            </Button>
          )}
        </div>
      </Card>

      {/* Cartões por Classe de Ativos com Autocomplete + Nome Completo + Dividir Igual */}
      <div className="grid gap-5 lg:grid-cols-2">
        {TARGET_SECTIONS.map((sec) => (
          <CategoryTargetCard
            key={sec.key}
            categoryKey={sec.key}
            title={sec.title}
            radarTypeSlug={sec.radarTypeSlug}
            effectivePortfolioPercent={computeEffectiveClassPercent(macro, sec.key)}
            items={targets[sec.key] || []}
            onChangeItems={(nextItems) => updateCategoryItems(sec.key, nextItems)}
            onEqualizeWeights={() =>
              updateCategoryItems(sec.key, distributeEqualTargetWeights(targets[sec.key] || []))
            }
          />
        ))}
      </div>
    </div>
  );
}
