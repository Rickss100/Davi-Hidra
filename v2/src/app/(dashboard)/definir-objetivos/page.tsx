'use client';

import React, { useEffect, useState } from 'react';
import { Award, Globe, Save, Plus, Trash2 } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Button, Card, Input, Badge, Skeleton } from '@/components/ui/primitives';
import type { AssetTargetsConfig, MacroAllocationConfig } from '@/db/schema';

type TargetCat = keyof AssetTargetsConfig;

const TARGET_SECTIONS: Array<{ key: TargetCat; title: string }> = [
  { key: 'acoes', title: 'Ações Brasil' },
  { key: 'fiis', title: 'Fundos Imobiliários (FIIs)' },
  { key: 'fixed', title: 'Renda Fixa' },
  { key: 'stocks', title: 'Stocks (EUA)' },
  { key: 'reits', title: 'REITs (EUA)' }
];

export default function DefinirObjetivosPage() {
  const { data, isLoading, refetch } = usePortfolioData();
  const [macro, setMacro] = useState<MacroAllocationConfig | null>(null);
  const [targets, setTargets] = useState<AssetTargetsConfig | null>(null);
  const [newTicker, setNewTicker] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (data?.snapshot.objectives) {
      setMacro(data.snapshot.objectives.macroAllocation);
      setTargets(data.snapshot.objectives.assetTargets);
    }
  }, [data]);

  if (isLoading || !macro || !targets) {
    return <Skeleton className="h-96" />;
  }

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const applyPreset = async (preset: 'brasil' | 'global') => {
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
            ? '✓ Régua Padrão Ouro 100% Brasil aplicada no servidor!'
            : '✓ Régua Padrão Ouro Global (Brasil + EUA) aplicada no servidor!'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustom = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/portfolio/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ macroAllocation: macro, assetTargets: targets })
      });
      if (res.ok) {
        await refetch();
        notify('✓ Estratégia personalizada salva no PostgreSQL com sucesso!');
      }
    } finally {
      setSaving(false);
    }
  };

  const addAssetToCategory = (cat: TargetCat) => {
    const code = (newTicker[cat] || '').trim().toUpperCase();
    if (!code) return;
    setTargets((prev) => {
      if (!prev) return prev;
      const list = prev[cat] || [];
      if (list.some((i) => i.code.toUpperCase() === code)) return prev;
      return {
        ...prev,
        [cat]: [...list, { code, target: 10 }]
      };
    });
    setNewTicker((prev) => ({ ...prev, [cat]: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Objetivos & Régua Patrimonial</h1>
          <p className="text-xs text-slate-400">
            Configure os pesos ideais para orientar o motor de rebalanceamento DAVI & Hydra.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => applyPreset('brasil')} disabled={saving}>
            <Award className="h-4 w-4 text-gold-400" />
            Padrão Ouro 100% Brasil
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset('global')} disabled={saving}>
            <Globe className="h-4 w-4 text-sky-400" />
            Padrão Ouro Global (BR + EUA)
          </Button>
          <Button variant="gold" size="sm" onClick={handleSaveCustom} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Régua'}
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/15 p-3.5 text-xs font-semibold text-emerald-300">
          {message}
        </div>
      )}

      {/* 1. Alocação Macro */}
      <Card className="space-y-4">
        <h2 className="text-base font-bold text-white">1. Divisão Macro Estratégica (%)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="m-fixed" className="mb-1 block text-xs text-slate-400">
              Renda Fixa (%) — Variável: {100 - macro.fixed}%
            </label>
            <Input
              id="m-fixed"
              type="number"
              min="0"
              max="100"
              value={macro.fixed}
              onChange={(e) => {
                const f = Math.min(100, Math.max(0, Number(e.target.value)));
                setMacro({ ...macro, fixed: f, variable: 100 - f });
              }}
            />
          </div>

          <div>
            <label htmlFor="m-brasil" className="mb-1 block text-xs text-slate-400">
              Brasil (%) — Exterior EUA: {100 - macro.brasil}%
            </label>
            <Input
              id="m-brasil"
              type="number"
              min="0"
              max="100"
              value={macro.brasil}
              onChange={(e) => {
                const br = Math.min(100, Math.max(0, Number(e.target.value)));
                setMacro({ ...macro, brasil: br, usa: 100 - br });
              }}
            />
          </div>

          <div>
            <label htmlFor="m-acoes" className="mb-1 block text-xs text-slate-400">
              No Brasil: Ações (%) — FIIs: {100 - macro.acoes}%
            </label>
            <Input
              id="m-acoes"
              type="number"
              min="0"
              max="100"
              value={macro.acoes}
              onChange={(e) => {
                const ac = Math.min(100, Math.max(0, Number(e.target.value)));
                setMacro({ ...macro, acoes: ac, fiis: 100 - ac });
              }}
            />
          </div>

          <div>
            <label htmlFor="m-stocks" className="mb-1 block text-xs text-slate-400">
              Nos EUA: Stocks (%) — REITs: {100 - macro.stocks}%
            </label>
            <Input
              id="m-stocks"
              type="number"
              min="0"
              max="100"
              value={macro.stocks}
              onChange={(e) => {
                const st = Math.min(100, Math.max(0, Number(e.target.value)));
                setMacro({ ...macro, stocks: st, reits: 100 - st });
              }}
            />
          </div>
        </div>
      </Card>

      {/* 2. Metas por Ativo */}
      <div className="grid gap-5 lg:grid-cols-2">
        {TARGET_SECTIONS.map((sec) => {
          const list = targets[sec.key] || [];
          const sum = list.reduce((acc, item) => acc + Number(item.target || 0), 0);
          return (
            <Card key={sec.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{sec.title}</h3>
                <Badge tone={sum === 100 || list.length === 0 ? 'emerald' : 'gold'}>
                  Soma: {sum}%
                </Badge>
              </div>

              <div className="flex gap-2">
                <label htmlFor={`add-${sec.key}`} className="sr-only">
                  Adicionar ativo em {sec.title}
                </label>
                <Input
                  id={`add-${sec.key}`}
                  value={newTicker[sec.key] || ''}
                  onChange={(e) => setNewTicker({ ...newTicker, [sec.key]: e.target.value })}
                  placeholder="Ticker (ex: WEGE3)"
                  className="h-9 text-xs"
                />
                <Button size="sm" variant="outline" onClick={() => addAssetToCategory(sec.key)}>
                  <Plus className="h-3.5 w-3.5" />
                  Incluir
                </Button>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {list.map((item, idx) => (
                  <div
                    key={item.code}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-obsidian-950 px-3 py-1.5 text-xs"
                  >
                    <span className="font-bold text-white">{item.code}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        aria-label={`Peso alvo de ${item.code}`}
                        type="number"
                        min="0"
                        max="100"
                        value={item.target}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const copy = [...list];
                          copy[idx] = { ...item, target: val };
                          setTargets({ ...targets, [sec.key]: copy });
                        }}
                        className="h-7 w-20 text-right font-mono text-xs"
                      />
                      <span className="text-slate-400">%</span>
                      <button
                        type="button"
                        aria-label={`Remover ${item.code}`}
                        onClick={() =>
                          setTargets({
                            ...targets,
                            [sec.key]: list.filter((_, i) => i !== idx)
                          })
                        }
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
