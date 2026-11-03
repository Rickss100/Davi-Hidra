'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  Info,
  MinusCircle,
  Percent,
  PiggyBank,
  PlusCircle,
  Save,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Badge, Button, Card, Input, Select, Skeleton } from '@/components/ui/primitives';
import { d, formatBRL, formatPercent, roundCurrency, roundPercent } from '@/lib/money';
import { resolveAssetDisplayName } from '@/lib/asset-names';
import {
  ReserveRoadmapCard,
  ReserveWhereToKeepCards
} from '@/components/reserva/reserve-educational-guide';
import { ReserveTransactionModal } from '@/components/reserva/reserve-transaction-modal';
import { cn } from '@/lib/utils';
import type { EmergencyReserveConfig } from '@/db/schema';

const PROFILE_PRESETS = [
  { id: 'concursado', title: '🏛️ Concursado', subtitle: '3 a 4 meses', months: 4 },
  { id: 'clt', title: '🏢 CLT Privado', subtitle: '6 meses', months: 6 },
  { id: 'autonomo', title: '💼 Autônomo / PJ', subtitle: '12 meses', months: 12 }
] as const;

export default function ReservaEmergenciaPage() {
  const { data, isLoading, refetch } = usePortfolioData();

  const [form, setForm] = useState<EmergencyReserveConfig>({
    monthlyExpense: 3000,
    monthsTarget: 6,
    manualReserveBalance: 0,
    strategyMode: 'hybrid_70_30'
  });
  const [monthlySimulationBrl, setMonthlySimulationBrl] = useState(1000);
  const [modalMode, setModalMode] = useState<'aporte' | 'resgate' | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    if (data?.snapshot.objectives.emergencyConfig) {
      setForm(data.snapshot.objectives.emergencyConfig);
    }
  }, [data]);

  if (isLoading || !data) {
    return <Skeleton className="h-[560px]" />;
  }

  const { snapshot } = data;
  const reserve = snapshot.emergencyReserve;
  const selicRate = snapshot.selicRate > 0 ? snapshot.selicRate : 13.75;

  const notify = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const persistEmergencyConfig = async (nextConfig: EmergencyReserveConfig, customMsg?: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/portfolio/objectives', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyConfig: nextConfig })
      });
      if (res.ok) {
        await refetch();
        notify(customMsg || '✓ Planejamento da Reserva de Emergência salvo com sucesso!');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistEmergencyConfig(form);
  };

  const handleSelectProfile = async (months: number, title: string) => {
    const nextConfig: EmergencyReserveConfig = { ...form, monthsTarget: months };
    setForm(nextConfig);
    await persistEmergencyConfig(
      nextConfig,
      `✓ Perfil ${title} (${months} meses de cobertura) aplicado!`
    );
  };

  // Cálculos reativos em tempo real com Decimal.js
  const custodyReserveDec = reserve.reserveAssets.reduce(
    (acc, asset) => acc.plus(d(asset.currentValueBrl)),
    d(0)
  );
  const manualDec = d(Math.max(0, form.manualReserveBalance || 0));
  const totalCurrentDec = custodyReserveDec.plus(manualDec);
  const expenseDec = d(Math.max(0, form.monthlyExpense || 0));
  const monthsDec = d(Math.max(1, form.monthsTarget || 6));
  const targetDec = expenseDec.mul(monthsDec);
  const missingDec = targetDec.greaterThan(totalCurrentDec)
    ? targetDec.minus(totalCurrentDec)
    : d(0);

  const completionPct = targetDec.greaterThan(0)
    ? Math.min(100, roundPercent(totalCurrentDec.div(targetDec).mul(100), 1))
    : 0;
  const monthsCovered = expenseDec.greaterThan(0)
    ? roundPercent(totalCurrentDec.div(expenseDec), 1)
    : 0;
  const missingMonths = expenseDec.greaterThan(0)
    ? roundPercent(missingDec.div(expenseDec), 1)
    : 0;

  const liveStatus: 'critico' | 'em_construcao' | 'quase_blindada' | 'blindada' =
    completionPct >= 100
      ? 'blindada'
      : completionPct >= 70
        ? 'quase_blindada'
        : completionPct >= 30
          ? 'em_construcao'
          : 'critico';

  const annualYieldCurrent = roundCurrency(totalCurrentDec.mul(d(selicRate).div(100)));
  const monthlyYieldCurrent = roundCurrency(d(annualYieldCurrent).div(12));
  const monthlyYieldAtGoal = roundCurrency(targetDec.mul(d(selicRate).div(100)).div(12));
  const monthsToFinish =
    monthlySimulationBrl > 0 && missingDec.greaterThan(0)
      ? Math.ceil(missingDec.div(d(monthlySimulationBrl)).toNumber())
      : 0;

  const statusMeta = {
    critico: {
      label: '🔴 Nível Crítico',
      tone: 'rose' as const,
      barClass: 'from-rose-500 to-amber-500'
    },
    em_construcao: {
      label: '🟠 Em Construção',
      tone: 'gold' as const,
      barClass: 'from-amber-500 to-gold-400'
    },
    quase_blindada: {
      label: '🟡 Quase Blindada',
      tone: 'gold' as const,
      barClass: 'from-gold-400 to-emerald-400'
    },
    blindada: {
      label: '🛡️ Reserva Blindada (100%)',
      tone: 'emerald' as const,
      barClass: 'from-emerald-500 to-emerald-300'
    }
  }[liveStatus];

  const strategyLabel =
    form.strategyMode === 'focus_100'
      ? '100% Reserva'
      : form.strategyMode === 'hybrid_50_50'
        ? '50% Reserva / 50% Carteira'
        : '70% Reserva / 30% Carteira';

  return (
    <div className="space-y-6">
      <ReserveTransactionModal
        mode={modalMode}
        reserveAssets={reserve.reserveAssets}
        onClose={() => setModalMode(null)}
        onSuccess={async (msg) => {
          await refetch();
          notify(msg);
        }}
      />

      {/* 1. Cabeçalho Institucional + Ações Rápidas */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-white sm:text-3xl">
            <PiggyBank className="h-8 w-8 text-emerald-400" />
            Reserva de Emergência — Blindagem Antifrágil
          </h1>
          <p className="mt-1 text-sm text-slate-200 sm:text-base">
            Sua fortaleza de proteção patrimonial e liquidez diária antes de qualquer exposição ao
            risco na renda variável.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="emerald"
            size="md"
            onClick={() => setModalMode('aporte')}
            className="text-sm font-extrabold"
          >
            <PlusCircle className="h-4 w-4" />
            Novo Aporte na Reserva
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setModalMode('resgate')}
            className="text-sm font-bold text-slate-100"
          >
            <MinusCircle className="h-4 w-4 text-rose-400" />
            Registrar Resgate
          </Button>

          <Link
            href="/onde-aportar"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gold-500/45 bg-obsidian-900 px-4 text-sm font-bold text-gold-300 transition hover:bg-gold-500/15"
          >
            Ver Onde Aportar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div className="rounded-xl border-2 border-emerald-400/50 bg-[#081a14] p-4 text-sm font-bold text-emerald-200">
          {feedbackMsg}
        </div>
      )}

      {/* 2. Trilha Passo a Passo para o Investidor Iniciante */}
      <ReserveRoadmapCard
        hasGoalConfigured={snapshot.objectives.hasCustomObjectives || form.monthlyExpense > 0}
        hasAnyBalance={totalCurrentDec.greaterThan(0)}
        isFullyShielded={liveStatus === 'blindada'}
        onOpenNewAporte={() => setModalMode('aporte')}
      />

      {/* 3. Quatro Cards de Métricas Principais */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2 border-emerald-500/45 bg-[#071913] p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-300 sm:text-sm">
            <span>Meta da Reserva</span>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="money-value text-2xl font-extrabold text-white sm:text-3xl">
            {formatBRL(roundCurrency(targetDec))}
          </p>
          <p className="text-xs text-slate-200 sm:text-sm">
            {form.monthsTarget} meses de custo essencial ({formatBRL(form.monthlyExpense)}/mês)
          </p>
        </Card>

        <Card className="space-y-2 p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300 sm:text-sm">
            <span>Saldo Acumulado</span>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="money-value text-2xl font-extrabold text-emerald-400 sm:text-3xl">
            {formatBRL(roundCurrency(totalCurrentDec))}
          </p>
          <p className="text-xs text-slate-200 sm:text-sm">
            {reserve.reserveAssets.length} título(s) de liquidez
            {manualDec.greaterThan(0) ? ` + ${formatBRL(roundCurrency(manualDec))} externo` : ''}
          </p>
        </Card>

        <Card className="space-y-2 p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300 sm:text-sm">
            <span>Tempo de Cobertura</span>
            <Calendar className="h-5 w-5 text-sky-400" />
          </div>
          <p className="money-value text-2xl font-extrabold text-sky-400 sm:text-3xl">
            {monthsCovered.toFixed(1)}{' '}
            <span className="text-base font-bold text-sky-200">meses</span>
          </p>
          <p className="text-xs text-slate-200 sm:text-sm">
            {missingDec.greaterThan(0)
              ? `Faltam ${formatBRL(roundCurrency(missingDec))} (${missingMonths.toFixed(1)} meses)`
              : '100% Protegido contra imprevistos!'}
          </p>
        </Card>

        <Card className="space-y-2 p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300 sm:text-sm">
            <span>Rentabilidade Soberana</span>
            <Percent className="h-5 w-5 text-gold-400" />
          </div>
          <p className="money-value text-2xl font-extrabold text-gold-300 sm:text-3xl">
            {selicRate.toFixed(2)}%{' '}
            <span className="text-sm font-bold text-slate-200">a.a. (Selic/CDI)</span>
          </p>
          <p className="text-xs text-slate-200 sm:text-sm">
            Rendimento atual: ~{formatBRL(monthlyYieldCurrent)}/mês
          </p>
        </Card>
      </div>

      {/* 4. Termômetro Visual: Progresso da Blindagem Financeira */}
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
            <h2 className="text-lg font-extrabold text-white sm:text-xl">
              Progresso da Blindagem Financeira
            </h2>
          </div>
          <Badge tone={statusMeta.tone} className="px-3.5 py-1 text-xs font-extrabold sm:text-sm">
            {statusMeta.label} ({formatPercent(completionPct, 1)})
          </Badge>
        </div>

        <div className="h-4 w-full overflow-hidden rounded-full bg-obsidian-950 p-0.5">
          <div
            className={cn(
              'h-full rounded-full bg-gradient-to-r transition-all',
              statusMeta.barClass
            )}
            style={{ width: `${Math.max(4, completionPct)}%` }}
          />
        </div>

        <div className="flex flex-wrap justify-between gap-2 text-xs font-semibold text-slate-300 sm:text-sm">
          <span>0 meses (0%)</span>
          <span>{Math.max(1, Math.round(form.monthsTarget / 2))} meses (50%)</span>
          <span>{form.monthsTarget} meses (100% Alvo)</span>
          <span>{Math.max(12, form.monthsTarget * 2)} meses (Segurança Máxima)</span>
        </div>

        {/* Régua Visual dos 3 Níveis de Segurança do Método */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 pt-1">
          <div
            className={cn(
              'rounded-lg border p-2.5 text-xs transition',
              monthsCovered < 3
                ? 'border-rose-500/60 bg-rose-500/10 text-rose-200'
                : 'border-slate-800 bg-obsidian-900/40 text-slate-400'
            )}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span>🔴 Nível 1: Vulnerável</span>
              {monthsCovered < 3 && (
                <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">
                  Atual
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] leading-snug">
              Menos de 3 meses. Alto risco de dívidas em imprevistos. Prioridade absoluta de aporte.
            </div>
          </div>

          <div
            className={cn(
              'rounded-lg border p-2.5 text-xs transition',
              monthsCovered >= 3 && monthsCovered < form.monthsTarget
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-200'
                : 'border-slate-800 bg-obsidian-900/40 text-slate-400'
            )}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span>🟡 Nível 2: Em Construção</span>
              {monthsCovered >= 3 && monthsCovered < form.monthsTarget && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                  Atual
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] leading-snug">
              Entre 3 meses e a meta. Proteção intermediária. Permite aportes híbridos (70/30).
            </div>
          </div>

          <div
            className={cn(
              'rounded-lg border p-2.5 text-xs transition',
              monthsCovered >= form.monthsTarget
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
                : 'border-slate-800 bg-obsidian-900/40 text-slate-400'
            )}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span>🛡️ Nível 3: Blindada</span>
              {monthsCovered >= form.monthsTarget && (
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                  Atual
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] leading-snug">
              {form.monthsTarget}+ meses constituídos. Blindagem total. Sinal verde para 100% em
              carteira.
            </div>
          </div>
        </div>

        <div
          className={cn(
            'rounded-xl border-2 p-4 text-sm leading-relaxed sm:text-[15px]',
            liveStatus === 'blindada'
              ? 'border-emerald-500/50 bg-[#081a14] text-slate-100'
              : 'border-amber-400/55 bg-[#191407] text-slate-100'
          )}
        >
          {liveStatus === 'blindada' ? (
            <>
              ✅ <strong className="text-emerald-300">Excelente trabalho!</strong> Sua reserva de
              emergência está 100% constituída. Seu patrimônio está blindado contra imprevistos e a
              aba <strong className="text-white">Onde Aportar</strong> já pode direcionar 100% dos
              novos aportes para multiplicar sua carteira.
            </>
          ) : (
            <>
              ⚠️ <strong className="text-amber-300">Orientação Antifrágil MANTFRAI:</strong> Você
              possui atualmente <strong className="text-white">{monthsCovered.toFixed(1)} meses</strong>{' '}
              de despesas cobertas. O sistema está configurado para priorizar{' '}
              <strong className="text-emerald-300">{strategyLabel}</strong> até atingir sua meta de{' '}
              <strong className="text-white">{formatBRL(roundCurrency(targetDec))}</strong>.
            </>
          )}
        </div>
      </Card>

      {/* 5. Grid Principal: 1. Planejamento de Custo/Perfil + 2. Simulador de Conclusão e Rendimento */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coluna 1: Planejamento */}
        <Card className="p-5 sm:p-6">
          <form onSubmit={handleSaveSubmit} className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3.5">
              <Info className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-extrabold text-white sm:text-xl">
                1. Planejamento de Custo e Perfil
              </h2>
            </div>

            <div>
              <label htmlFor="res-cost" className="mb-1.5 block text-sm font-bold text-slate-100">
                Custo de Vida Mensal Essencial (R$)
              </label>
              <Input
                id="res-cost"
                type="number"
                min="0"
                step="100"
                value={form.monthlyExpense}
                onChange={(e) =>
                  setForm({ ...form, monthlyExpense: Math.max(0, Number(e.target.value) || 0) })
                }
                className="money-value h-11 text-base font-extrabold text-white"
              />
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300 sm:text-sm">
                Some moradia, alimentação básica, saúde, luz/água/internet e transporte essencial.
              </p>
            </div>

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-100">
                Perfil Profissional (Atalho de Meses Recomendados)
              </span>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {PROFILE_PRESETS.map((p) => {
                  const active = form.monthsTarget === p.months;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProfile(p.months, p.title)}
                      className={cn(
                        'rounded-xl border-2 px-3 py-2.5 text-center transition',
                        active
                          ? 'border-emerald-400 bg-emerald-500/20 text-white'
                          : 'border-slate-700 bg-obsidian-950 text-slate-200 hover:border-gold-400/50'
                      )}
                    >
                      <span className="block text-sm font-extrabold">{p.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-300">{p.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="res-slider" className="mb-1.5 block text-sm font-bold text-slate-100">
                Meses de Cobertura Desejados:{' '}
                <strong className="text-emerald-300">{form.monthsTarget} meses</strong>
              </label>
              <input
                id="res-slider"
                type="range"
                min="3"
                max="24"
                step="1"
                value={form.monthsTarget}
                onChange={(e) => setForm({ ...form, monthsTarget: Number(e.target.value) })}
                className="h-2.5 w-full cursor-pointer accent-emerald-400"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-300">
                <span>3 meses</span>
                <span>12 meses</span>
                <span>24 meses</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="res-manual" className="mb-1.5 block text-sm font-bold text-slate-100">
                  Saldo em Conta Externa D+0 (R$)
                </label>
                <Input
                  id="res-manual"
                  type="number"
                  min="0"
                  step="100"
                  value={form.manualReserveBalance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      manualReserveBalance: Math.max(0, Number(e.target.value) || 0)
                    })
                  }
                  className="money-value h-11 text-base font-extrabold text-white"
                />
                <p className="mt-1 text-xs text-slate-300">
                  Opcional: caixinha/conta 100% CDI fora da corretora.
                </p>
              </div>

              <div>
                <label htmlFor="res-mode" className="mb-1.5 block text-sm font-bold text-slate-100">
                  Prioridade quando Incompleta
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
                  className="h-11 text-sm font-bold text-white"
                >
                  <option value="focus_100">🛡️ Foco Total (100% Reserva)</option>
                  <option value="hybrid_70_30">⚖️ Híbrido (70% Reserva / 30% Carteira)</option>
                  <option value="hybrid_50_50">🎯 Meio a Meio (50% Reserva / 50% Carteira)</option>
                </Select>
                <p className="mt-1 text-xs text-slate-300">
                  Usada automaticamente na aba Onde Aportar.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={saving}
              className="w-full text-sm font-extrabold sm:text-base"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Salvando...' : 'Salvar Planejamento da Reserva'}
            </Button>
          </form>
        </Card>

        {/* Coluna 2: Simulador de Conclusão e Rendimento */}
        <Card className="flex flex-col justify-between space-y-5 p-5 sm:p-6">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3.5">
              <Clock className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-extrabold text-white sm:text-xl">
                2. Simulador de Conclusão e Rendimento
              </h2>
            </div>

            <div>
              <label htmlFor="res-sim-aporte" className="mb-1.5 block text-sm font-bold text-slate-100">
                Simular Aporte Mensal Destinado à Reserva (R$)
              </label>
              <Input
                id="res-sim-aporte"
                type="number"
                min="0"
                step="100"
                value={monthlySimulationBrl}
                onChange={(e) => setMonthlySimulationBrl(Math.max(0, Number(e.target.value) || 0))}
                className="money-value h-11 text-base font-extrabold text-white"
              />
            </div>

            <div className="divide-y divide-slate-800 rounded-xl border border-slate-700/80 bg-obsidian-950 p-4 text-sm">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-slate-200">Tempo estimado para blindar a reserva:</span>
                <strong className="money-value text-base font-extrabold text-emerald-400">
                  {missingDec.lessThanOrEqualTo(0)
                    ? 'Concluída! 🎉'
                    : monthlySimulationBrl > 0
                      ? `${monthsToFinish} ${monthsToFinish === 1 ? 'mês' : 'meses'}`
                      : 'Informe um aporte'}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-slate-200">Rendimento bruto atual (Selic {selicRate}%):</span>
                <strong className="money-value font-extrabold text-white">
                  {formatBRL(annualYieldCurrent)}/ano ({formatBRL(monthlyYieldCurrent)}/mês)
                </strong>
              </div>

              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-slate-200">
                  Rendimento mensal quando atingir 100% da meta:
                </span>
                <strong className="money-value font-extrabold text-gold-300">
                  ~{formatBRL(monthlyYieldAtGoal)}/mês
                </strong>
              </div>

              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-slate-200">Garantia e Proteção:</span>
                <strong className="text-right font-extrabold text-emerald-300">
                  Tesouro Nacional / FGC até R$ 250 mil
                </strong>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gold-500/35 bg-[#161208] p-4 text-sm leading-relaxed text-slate-100">
            💡 <strong className="text-gold-300">Lembrete Fundamental:</strong> A reserva não visa
            enriquecer ou bater recordes de rentabilidade, mas sim garantir{' '}
            <strong className="text-white">paz de espírito</strong> para que você nunca precise
            vender ações ou fundos imobiliários na baixa durante um imprevisto.
          </div>
        </Card>
      </div>

      {/* 6. Tabela de Ativos que Compõem sua Reserva */}
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <h2 className="text-lg font-extrabold text-white sm:text-xl">
              Ativos que Compõem sua Reserva
            </h2>
          </div>

          <Button
            type="button"
            variant="emerald"
            size="md"
            onClick={() => setModalMode('aporte')}
            className="text-sm font-extrabold"
          >
            <PlusCircle className="h-4 w-4" />
            Registrar Aporte
          </Button>
        </div>

        {reserve.reserveAssets.length === 0 && manualDec.lessThanOrEqualTo(0) ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-obsidian-950/60 p-8 text-center">
            <p className="text-base font-bold text-white">
              Nenhum ativo de liquidez diária cadastrado ainda na sua Reserva.
            </p>
            <p className="mx-auto mt-1.5 max-w-xl text-sm leading-relaxed text-slate-200">
              Clique em <strong className="text-emerald-300">Registrar Aporte</strong> acima para
              lançar seu título (<strong className="text-white">Tesouro Selic</strong>,{' '}
              <strong className="text-white">CDB Liquidez Diária 100% CDI</strong> ou{' '}
              <strong className="text-white">Conta Remunerada</strong>) e acompanhar sua blindagem
              automaticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-obsidian-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-obsidian-900 text-xs font-bold uppercase tracking-wider text-slate-200 sm:text-sm">
                <tr>
                  <th className="px-4 py-3.5">Ativo / Título</th>
                  <th className="px-4 py-3.5">Liquidez & Garantia</th>
                  <th className="px-4 py-3.5 text-right">Saldo Acumulado</th>
                  <th className="px-4 py-3.5 text-right">Participação na Reserva</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {reserve.reserveAssets.map((asset) => {
                  const fullName = resolveAssetDisplayName(asset.code, asset.name);
                  const showSub = fullName.toUpperCase() !== asset.code.toUpperCase();
                  const sharePct = totalCurrentDec.greaterThan(0)
                    ? roundPercent(d(asset.currentValueBrl).div(totalCurrentDec).mul(100), 1)
                    : 0;

                  return (
                    <tr key={asset.code} className="hover:bg-obsidian-800/50">
                      <td className="px-4 py-3.5">
                        <span className="block text-base font-extrabold text-white">
                          {asset.code}
                        </span>
                        {showSub && (
                          <span className="block text-xs font-medium text-slate-300 sm:text-sm">
                            {fullName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone="emerald" className="text-xs font-bold">
                          Liquidez Diária (D+0 / D+1)
                        </Badge>
                      </td>
                      <td className="money-value px-4 py-3.5 text-right text-base font-extrabold text-emerald-300">
                        {formatBRL(asset.currentValueBrl)}
                      </td>
                      <td className="money-value px-4 py-3.5 text-right font-bold text-slate-100">
                        {formatPercent(sharePct, 1)}
                      </td>
                    </tr>
                  );
                })}

                {manualDec.greaterThan(0) && (
                  <tr className="bg-emerald-500/[0.04]">
                    <td className="px-4 py-3.5">
                      <span className="block text-base font-extrabold text-white">
                        Conta Externa Remunerada (D+0)
                      </span>
                      <span className="block text-xs font-medium text-slate-300 sm:text-sm">
                        Saldo informado manualmente no planejamento acima
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone="sky" className="text-xs font-bold">
                        Liquidez Imediata (D+0)
                      </Badge>
                    </td>
                    <td className="money-value px-4 py-3.5 text-right text-base font-extrabold text-emerald-300">
                      {formatBRL(roundCurrency(manualDec))}
                    </td>
                    <td className="money-value px-4 py-3.5 text-right font-bold text-slate-100">
                      {formatPercent(
                        totalCurrentDec.greaterThan(0)
                          ? roundPercent(manualDec.div(totalCurrentDec).mul(100), 1)
                          : 0,
                        1
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 7. Guia Prático Educativo: Onde Guardar vs Onde NUNCA Guardar */}
      <ReserveWhereToKeepCards />
    </div>
  );
}
