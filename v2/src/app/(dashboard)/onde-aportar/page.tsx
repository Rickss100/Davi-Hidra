'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Copy,
  DollarSign,
  MessageCircle,
  Scale,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Badge, Button, Card, Input, Select, Skeleton } from '@/components/ui/primitives';
import { formatBRL } from '@/lib/money';
import type { InvestmentSuggestionDTO } from '@/server/engines/davi-hydra.engine';
import {
  HIDE_METHOD_MODAL_KEY,
  MethodExplanationModal
} from '@/components/onde-aportar/method-explanation-modal';
import {
  EmergencyStrategyBanner,
  type ReserveAporteStrategy
} from '@/components/onde-aportar/emergency-strategy-banner';
import { DistancePanel } from '@/components/onde-aportar/distance-panel';

export default function OndeAportarPage() {
  const { data, isLoading, refetch } = usePortfolioData();

  const [showMethodModal, setShowMethodModal] = useState(false);
  const [amountInput, setAmountInput] = useState('1000');
  const [numAssets, setNumAssets] = useState('3');
  const [reserveStrategy, setReserveStrategy] = useState<ReserveAporteStrategy>('hybrid_70_30');
  const [strategyInitialized, setStrategyInitialized] = useState(false);

  const [suggestions, setSuggestions] = useState<InvestmentSuggestionDTO[]>([]);
  const [totalSuggestedBrl, setTotalSuggestedBrl] = useState(0);
  const [whatsappText, setWhatsappText] = useState('');
  const [emptyReason, setEmptyReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [confirmRegister, setConfirmRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const parseNumericAmount = (raw: string): number => {
    const cleaned = raw.trim().replace(/\./g, '').replace(',', '.');
    const parsed = Number(raw.includes(',') ? cleaned : raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const executeSimulation = async (params: {
    amountBrl: number;
    targetNumAssets: number;
    targetStrategy: ReserveAporteStrategy;
  }) => {
    setErrorMsg('');
    setEmptyReason('');
    setFeedbackMsg('');
    setConfirmRegister(false);

    if (params.amountBrl <= 0) {
      setErrorMsg('Informe um valor disponível maior que R$ 0,00 para calcular o aporte.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availableAmountBrl: params.amountBrl,
          numAssets: params.targetNumAssets,
          reserveStrategy: params.targetStrategy
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || 'Falha ao calcular sugestões.');
        return;
      }

      setSuggestions(json.suggestions || []);
      setTotalSuggestedBrl(json.totalSuggestedBrl || 0);
      setWhatsappText(json.whatsappSummary || '');
      setEmptyReason(json.emptyReason || '');
    } finally {
      setLoading(false);
    }
  };

  // Abre o aviso explicativo automaticamente na primeira entrada do investidor
  useEffect(() => {
    const hidden = localStorage.getItem(HIDE_METHOD_MODAL_KEY);
    if (hidden !== 'true') {
      setShowMethodModal(true);
    }
  }, []);

  // Sincroniza estratégia inicial com a Reserva de Emergência e já calcula a primeira sugestão
  useEffect(() => {
    if (!strategyInitialized && data?.snapshot.emergencyReserve) {
      const reserve = data.snapshot.emergencyReserve;
      const initialStrategy: ReserveAporteStrategy =
        reserve.reserveStatus === 'blindada'
          ? 'free'
          : reserve.strategyMode === 'focus_100'
            ? 'focus_100'
            : 'hybrid_70_30';

      setReserveStrategy(initialStrategy);
      setStrategyInitialized(true);
      void executeSimulation({
        amountBrl: 1000,
        targetNumAssets: 3,
        targetStrategy: initialStrategy
      });
    }
  }, [data, strategyInitialized]);

  if (isLoading || !data) {
    return <Skeleton className="h-[540px]" />;
  }

  const { snapshot } = data;

  const handleCalculateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSimulation({
      amountBrl: parseNumericAmount(amountInput),
      targetNumAssets: Number(numAssets),
      targetStrategy: reserveStrategy
    });
  };

  const handleChangeStrategy = async (nextStrategy: ReserveAporteStrategy) => {
    setReserveStrategy(nextStrategy);
    const numericAmount = parseNumericAmount(amountInput);
    if (numericAmount > 0) {
      await executeSimulation({
        amountBrl: numericAmount,
        targetNumAssets: Number(numAssets),
        targetStrategy: nextStrategy
      });
    }
  };

  const handleChangeNumAssets = async (nextNumStr: string) => {
    setNumAssets(nextNumStr);
    const numericAmount = parseNumericAmount(amountInput);
    if (numericAmount > 0) {
      await executeSimulation({
        amountBrl: numericAmount,
        targetNumAssets: Number(nextNumStr),
        targetStrategy: reserveStrategy
      });
    }
  };

  const handleCopyTicker = async (ticker: string) => {
    await navigator.clipboard.writeText(ticker);
    setFeedbackMsg(`✓ Código ${ticker} copiado para colar no Home Broker!`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleCopyWhatsApp = async () => {
    if (!whatsappText) return;
    await navigator.clipboard.writeText(whatsappText);
    setFeedbackMsg('✓ Resumo do plano de aporte copiado para o WhatsApp!');
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const handleRegisterAll = async () => {
    if (suggestions.length === 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const items = suggestions.map((s) => ({
        assetCode: s.ticker,
        type: 'buy' as const,
        categoryHint: s.categoria,
        quantity: s.cotas > 0 ? s.cotas : 1,
        price:
          s.cotas > 0
            ? Number((s.valorTotal / s.cotas).toFixed(4))
            : Number(s.valorTotal.toFixed(2)),
        totalValue: s.valorTotal,
        executedDate: today,
        notes: 'Aporte guiado pelo Onde Aportar (Método DAVI & Hydra)'
      }));

      const res = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (!res.ok) {
        setErrorMsg('Não foi possível registrar os aportes na custódia.');
        return;
      }

      setConfirmRegister(false);
      setFeedbackMsg('✓ Aportes registrados na Carteira Consolidada com sucesso!');
      await refetch();
    } finally {
      setLoading(false);
    }
  };

  const requestedCount = Number(numAssets);
  const isFocus100Active =
    reserveStrategy === 'focus_100' && snapshot.emergencyReserve.reserveStatus !== 'blindada';

  return (
    <div className="space-y-6">
      <MethodExplanationModal
        open={showMethodModal}
        onClose={() => setShowMethodModal(false)}
      />

      {/* Cabeçalho Institucional + Botão Reabrir Explicação do Método */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Onde Aportar — Método DAVI & Hydra
          </h1>
          <p className="mt-1 text-sm text-slate-200 sm:text-base">
            Calculadora inteligente de equilíbrio patrimonial (AM2O): aporta no que está descontado sem girar carteira.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => setShowMethodModal(true)}
          className="border-gold-500/40 text-sm font-bold text-slate-100"
        >
          <BookOpen className="h-4 w-4 text-gold-400" />
          Como funciona o Método?
        </Button>
      </div>

      {/* Faixa Informativa Resumida dos 3 Pilares com Tipografia Ampla */}
      <div className="grid gap-3.5 md:grid-cols-3">
        <div className="flex items-start gap-3.5 rounded-2xl border border-slate-700/80 bg-obsidian-900/90 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <strong className="block text-sm font-extrabold text-white sm:text-base">
              1. Blindagem Hydra (Reserva)
            </strong>
            <p className="mt-1 text-sm leading-relaxed text-slate-200">
              Garante seu colchão de liquidez antes de acelerar renda variável.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-slate-700/80 bg-obsidian-900/90 p-4">
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
          <div>
            <strong className="block text-sm font-extrabold text-white sm:text-base">
              2. Régua de Equilíbrio (AM2O)
            </strong>
            <p className="mt-1 text-sm leading-relaxed text-slate-200">
              Direciona o aporte aos ativos mais distantes abaixo da sua meta (%).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-slate-700/80 bg-obsidian-900/90 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
          <div>
            <strong className="block text-sm font-extrabold text-white sm:text-base">
              3. Guardião de Qualidade DAVI
            </strong>
            <p className="mt-1 text-sm leading-relaxed text-slate-200">
              Audita ROE, dividendos e teto de P/VP no servidor antes de sugerir.
            </p>
          </div>
        </div>
      </div>

      {/* Layout Principal em 2 Colunas (Simulador à Esquerda + Distância p/ Objetivo à Direita) */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <Card className="space-y-5 border-gold-500/30 p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3.5">
            <Compass className="h-6 w-6 text-gold-400" />
            <h2 className="text-lg font-extrabold text-white sm:text-xl">
              Simulador de Aporte Mensal
            </h2>
          </div>

          {/* Destaque Rápido dos Ativos Sugeridos */}
          {suggestions.length > 0 && (
            <div className="rounded-xl border-2 border-emerald-500/40 bg-[#081a14] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100 sm:text-base">
                  Na sua carteira este mês, pela sua régua de metas, é aconselhável direcionar para:
                </p>
                <Badge tone="emerald" className="px-3 py-1 text-xs font-extrabold sm:text-sm">
                  {suggestions.length}{' '}
                  {suggestions.length === 1 ? 'ativo indicado' : 'ativos indicados'}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s, idx) => (
                  <span
                    key={`${s.ticker}-${s.isEmergencyReserve ? 'res' : 'port'}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-3.5 py-1.5 text-sm font-extrabold text-emerald-200"
                  >
                    {s.ticker}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Banner Inteligente de Reserva de Emergência com os 3 Modos */}
          <EmergencyStrategyBanner
            reserve={snapshot.emergencyReserve}
            selectedStrategy={reserveStrategy}
            onChangeStrategy={handleChangeStrategy}
          />

          {/* Formulário de Entrada com Controles Amplos e Recálculo Automático */}
          <form onSubmit={handleCalculateSubmit} className="grid items-end gap-3.5 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label
                htmlFor="aporte-val"
                className="mb-1.5 block text-sm font-bold text-slate-100"
              >
                Disponível para Aportar (R$)
              </label>
              <Input
                id="aporte-val"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 1000,00"
                required
                value={amountInput}
                onChange={(e) =>
                  setAmountInput(e.target.value.replace(/[^0-9.,]/g, ''))
                }
                className="money-value h-11 text-base font-extrabold text-white"
              />
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="aporte-qtd"
                className="mb-1.5 block text-sm font-bold text-slate-100"
              >
                Quantidade de Indicações
              </label>
              <Select
                id="aporte-qtd"
                value={numAssets}
                onChange={(e) => handleChangeNumAssets(e.target.value)}
                className="h-11 text-base font-bold text-white"
              >
                <option value="1">1 Ativo (Foco)</option>
                <option value="2">2 Ativos</option>
                <option value="3">3 Ativos (Padrão Ouro)</option>
                <option value="4">4 Ativos</option>
                <option value="5">5 Ativos</option>
              </Select>
            </div>

            <div className="sm:col-span-3">
              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="h-11 w-full text-sm font-extrabold sm:text-base"
                disabled={loading}
              >
                {loading ? 'Calculando...' : 'Gerar Sugestão'}
              </Button>
            </div>
          </form>

          {/* Aviso explicativo caso 100% Reserva esteja selecionado com >1 ativo */}
          {isFocus100Active && requestedCount > 1 && (
            <div className="rounded-xl border-2 border-amber-400/60 bg-[#191407] p-4 text-sm leading-relaxed text-slate-100">
              <strong className="text-amber-300">ℹ️ Modo 100% Reserva ativo:</strong> Todo o aporte
              foi concentrado em 1 título de liquidez da Reserva de Emergência. Para dividir o
              valor em <strong className="text-white">{requestedCount} ativos</strong>, clique em{' '}
              <strong className="text-emerald-300">70% Reserva / 30% Carteira</strong> ou{' '}
              <strong className="text-emerald-300">100% Carteira</strong> acima.
            </div>
          )}

          {/* Aviso caso a carteira tenha menos ativos abaixo da meta do que o número solicitado */}
          {!isFocus100Active &&
            suggestions.length > 0 &&
            suggestions.length < requestedCount && (
              <div className="rounded-xl border border-amber-400/50 bg-[#191407] p-4 text-sm leading-relaxed text-slate-100">
                <strong className="text-amber-300">
                  ℹ️ {suggestions.length} de {requestedCount} indicações exibidas:
                </strong>{' '}
                Apenas {suggestions.length} ativo(s) da sua meta estão atualmente abaixo do
                percentual objetivo ou comportam cota com o valor informado.
              </div>
            )}

          {errorMsg && (
            <div className="rounded-xl border-2 border-rose-500/50 bg-[#1f0a10] p-4 text-sm font-semibold text-rose-200">
              {errorMsg}
            </div>
          )}

          {emptyReason && !errorMsg && (
            <div className="rounded-xl border-2 border-amber-400/55 bg-[#191407] p-4 text-sm leading-relaxed text-amber-100">
              {emptyReason}
            </div>
          )}

          {suggestions.length === 0 && !emptyReason && !errorMsg && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-obsidian-950/60 py-10 text-center">
              <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-300">
                <DollarSign className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-100 sm:text-base">
                Informe o valor disponível acima e clique em Gerar Sugestão.
              </p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-300 sm:text-sm">
                O motor cruzará sua custódia atual com suas metas em Definir Objetivos e com o status da sua Reserva de Emergência.
              </p>
            </div>
          )}

          {/* Tabela Institucional de Ordens Sugeridas com Tipografia Ampla */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-obsidian-950">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-800 bg-obsidian-900 text-xs font-bold uppercase tracking-wider text-slate-200 sm:text-sm">
                    <tr>
                      <th className="px-4 py-3.5">Código / Ativo</th>
                      <th className="px-4 py-3.5">Finalidade</th>
                      <th className="px-4 py-3.5 text-right">Cotas</th>
                      <th className="px-4 py-3.5 text-right">Valor Total</th>
                      <th className="px-4 py-3.5 text-center">Copiar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {suggestions.map((s, idx) => {
                      const showDistinctName =
                        s.assetName && s.assetName.toUpperCase() !== s.ticker.toUpperCase();
                      const formattedShares =
                        s.categoria === 'fixed'
                          ? '1'
                          : s.cotas.toLocaleString('pt-BR', { maximumFractionDigits: 4 });

                      return (
                        <tr
                          key={`${s.ticker}-${s.isEmergencyReserve ? 'res' : 'port'}-${idx}`}
                          className={
                            s.isEmergencyReserve
                              ? 'bg-amber-500/[0.06] hover:bg-amber-500/[0.11]'
                              : 'hover:bg-obsidian-800/50'
                          }
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-extrabold text-white">
                                {s.ticker}
                              </span>
                              {s.isEmergencyReserve && (
                                <Badge tone="gold" className="text-xs font-bold">
                                  🛡️ Reserva
                                </Badge>
                              )}
                            </div>
                            {showDistinctName && (
                              <span className="mt-0.5 block text-xs font-medium text-slate-200 sm:text-sm">
                                {s.assetName}
                              </span>
                            )}
                            {s.daviWarning && (
                              <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-400/55 bg-[#191407] px-3 py-2 text-xs leading-relaxed text-amber-100 sm:text-sm">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                                <span>{s.daviWarning}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-sm leading-relaxed text-slate-100">
                            <div>{s.reason}</div>
                            {s.magicNumberText && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-300">
                                <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                <span>{s.magicNumberText}</span>
                              </div>
                            )}
                          </td>
                          <td className="money-value px-4 py-3.5 text-right text-sm font-bold text-white sm:text-base">
                            {formattedShares}
                          </td>
                          <td className="money-value px-4 py-3.5 text-right text-sm font-extrabold text-emerald-300 sm:text-base">
                            {formatBRL(s.valorTotal)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              title={`Copiar código ${s.ticker}`}
                              aria-label={`Copiar código ${s.ticker}`}
                              onClick={() => handleCopyTicker(s.ticker)}
                              className="inline-flex items-center justify-center rounded-lg border border-emerald-400/50 bg-emerald-500/15 p-2.5 text-emerald-200 transition hover:bg-emerald-500/25"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex items-center justify-between border-t border-slate-800 bg-obsidian-900 px-4 py-3.5">
                  <span className="text-sm font-extrabold text-slate-100 sm:text-base">
                    Total do Aporte Alocado
                  </span>
                  <span className="money-value text-lg font-extrabold text-emerald-400 sm:text-xl">
                    {formatBRL(totalSuggestedBrl)}
                  </span>
                </div>
              </div>

              {feedbackMsg && (
                <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-400/50 bg-[#081a14] p-3.5 text-sm font-bold text-emerald-200">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <span>{feedbackMsg}</span>
                </div>
              )}

              {/* Barra Única de Ações Operacionais */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="emerald"
                  size="lg"
                  onClick={handleCopyWhatsApp}
                  className="w-full text-sm font-extrabold sm:text-base"
                >
                  <MessageCircle className="h-5 w-5" />
                  Copiar Resumo p/ WhatsApp
                </Button>

                {confirmRegister ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="gold"
                      size="lg"
                      className="flex-1 text-sm font-extrabold"
                      disabled={loading}
                      onClick={handleRegisterAll}
                    >
                      Confirmar Hoje
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setConfirmRegister(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setConfirmRegister(true)}
                    disabled={loading}
                    className="w-full border-gold-500/40 text-sm font-extrabold text-slate-100 sm:text-base"
                  >
                    <ArrowRight className="h-5 w-5 text-gold-400" />
                    Registrar Aportes na Carteira
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Coluna Direita: Painel Interativo de Distância para o Objetivo */}
        <div className="lg:col-span-5">
          <DistancePanel
            categoryDistances={snapshot.categoryDistances}
            assetDistancesByCategory={snapshot.assetDistancesByCategory}
            onOpenHelp={() => setShowMethodModal(true)}
          />
        </div>
      </div>

      {/* Aviso Legal Regulatório CVM 19/2021 — Alto Contraste e Leitura Confortável */}
      <div className="rounded-2xl border-2 border-amber-400/60 bg-[#161208] p-5 shadow-lg sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/50 bg-amber-500/20 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-amber-300 sm:text-lg">
              Aviso Importante & Regulatório (CVM 19/2021)
            </h3>
            <p className="text-sm leading-relaxed text-slate-100 sm:text-base">
              O <strong className="text-white">Método DAVI & Hydra</strong> é uma ferramenta
              educacional e uma calculadora matemática de rebalanceamento baseada exclusivamente nas
              suas próprias metas percentuais. As sugestões geradas{' '}
              <strong className="text-amber-200">
                não constituem análise, consultoria ou recomendação de compra ou venda
              </strong>{' '}
              de valores mobiliários (Resolução CVM 19/2021). Toda decisão de investimento é de sua
              exclusiva responsabilidade e perfil de risco.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
