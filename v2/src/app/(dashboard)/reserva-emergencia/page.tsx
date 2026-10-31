'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Save } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Button, Card, Input, Select, Badge, Skeleton } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import type { EmergencyReserveConfig } from '@/db/schema';

export default function ReservaEmergenciaPage() {
  const { data, isLoading, refetch } = usePortfolioData();
  const [form, setForm] = useState<EmergencyReserveConfig>({
    monthlyExpense: 3000,
    monthsTarget: 6,
    manualReserveBalance: 0,
    strategyMode: 'hybrid_70_30'
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (data?.snapshot.objectives.emergencyConfig) {
      setForm(data.snapshot.objectives.emergencyConfig);
    }
  }, [data]);

  if (isLoading || !data) {
    return <Skeleton className="h-96" />;
  }

  const reserve = data.snapshot.emergencyReserve;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/portfolio/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyConfig: form })
      });
      if (res.ok) {
        await refetch();
        setSavedMsg('✓ Parâmetros da Reserva Blindada atualizados!');
        setTimeout(() => setSavedMsg(''), 3500);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Reserva de Emergência Blindada</h1>
        <p className="text-xs text-slate-400">
          O alicerce de liquidez diária (Tesouro Selic / CDB Soberano D+0) que protege seu patrimônio contra imprevistos.
        </p>
      </div>

      <Card className="space-y-4 border-sky-500/25">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Termômetro de Blindagem Atual</h2>
          </div>
          <Badge tone={reserve.reserveStatus === 'blindada' ? 'emerald' : 'gold'}>
            {reserve.reserveStatus.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-obsidian-950">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-emerald-400 transition-all"
            style={{ width: `${Math.min(100, reserve.reserveCompletionPercent)}%` }}
          />
        </div>

        <div className="grid gap-4 pt-2 sm:grid-cols-3">
          <div>
            <span className="text-xs text-slate-400">Saldo em Liquidez Imediata</span>
            <p className="money-value text-xl font-bold text-white">
              {formatBRL(reserve.totalCurrentReserve)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Meta Ideal ({reserve.monthsTarget} meses)</span>
            <p className="money-value text-xl font-bold text-gold-400">
              {formatBRL(reserve.targetReserveAmount)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Valor Restante p/ Blindagem</span>
            <p className="money-value text-xl font-bold text-slate-200">
              {formatBRL(reserve.missingReserveAmount)} (
              {formatPercent(reserve.reserveCompletionPercent, 1)})
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="text-base font-bold text-white">Parâmetros Pessoais de Segurança</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="res-cost" className="mb-1.5 block text-xs text-slate-300">
                Custo Mensal Familiar (R$)
              </label>
              <Input
                id="res-cost"
                type="number"
                min="500"
                step="100"
                value={form.monthlyExpense}
                onChange={(e) => setForm({ ...form, monthlyExpense: Number(e.target.value) })}
              />
            </div>

            <div>
              <label htmlFor="res-months" className="mb-1.5 block text-xs text-slate-300">
                Meses de Cobertura Alvo
              </label>
              <Select
                id="res-months"
                value={String(form.monthsTarget)}
                onChange={(e) => setForm({ ...form, monthsTarget: Number(e.target.value) })}
              >
                <option value="3">3 Meses (CLT Estável)</option>
                <option value="6">6 Meses (Padrão Recomendado)</option>
                <option value="12">12 Meses (Empresário / Autônomo)</option>
              </Select>
            </div>

            <div>
              <label htmlFor="res-manual" className="mb-1.5 block text-xs text-slate-300">
                Reserva Externa / Conta D+0 (R$)
              </label>
              <Input
                id="res-manual"
                type="number"
                min="0"
                step="100"
                value={form.manualReserveBalance}
                onChange={(e) =>
                  setForm({ ...form, manualReserveBalance: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label htmlFor="res-mode" className="mb-1.5 block text-xs text-slate-300">
                Regra no Simulador Onde Aportar
              </label>
              <Select
                id="res-mode"
                value={form.strategyMode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    strategyMode: e.target.value as EmergencyReserveConfig['strategyMode']
                  })
                }
              >
                <option value="focus_100">100% Foco na Reserva</option>
                <option value="hybrid_70_30">Híbrido 70% Reserva / 30% Bolsa</option>
                <option value="hybrid_50_50">Híbrido 50% Reserva / 50% Bolsa</option>
              </Select>
            </div>
          </div>

          {savedMsg && <p className="text-xs font-semibold text-emerald-400">{savedMsg}</p>}

          <Button type="submit" variant="gold" size="sm" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
