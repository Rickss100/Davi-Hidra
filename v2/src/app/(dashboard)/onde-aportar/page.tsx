'use client';

import React, { useState } from 'react';
import { Compass, Copy, CheckCircle2, Sparkles } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Button, Card, Input, Select, Badge } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import type { InvestmentSuggestionDTO } from '@/server/engines/davi-hydra.engine';

export default function OndeAportarPage() {
  const { refetch } = usePortfolioData();
  const [amount, setAmount] = useState('1500');
  const [numAssets, setNumAssets] = useState('3');
  const [prioritizeReserve, setPrioritizeReserve] = useState(false);

  const [suggestions, setSuggestions] = useState<InvestmentSuggestionDTO[]>([]);
  const [whatsappText, setWhatsappText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [registeredMsg, setRegisteredMsg] = useState('');

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteredMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availableAmountBrl: Number(amount),
          numAssets: Number(numAssets),
          prioritizeEmergencyReserve: prioritizeReserve
        })
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setWhatsappText(data.whatsappSummary || '');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWhatsApp = async () => {
    if (!whatsappText) return;
    await navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRegisterAll = async () => {
    if (suggestions.length === 0) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const items = suggestions.map((s) => ({
        assetCode: s.ticker,
        type: 'buy' as const,
        categoryHint: s.categoria,
        quantity: s.cotas,
        price: s.currentPrice,
        totalValue: s.valorTotal,
        executedDate: today,
        notes: 'Aporte Inteligente DAVI & Hydra'
      }));

      const res = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (res.ok) {
        setRegisteredMsg('✓ Ordens registradas na custódia com sucesso!');
        await refetch();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">
          Onde Aportar — Motor DAVI & Hydra
        </h1>
        <p className="text-xs text-slate-400">
          Algoritmo proprietário executado no servidor para rebalancear sua carteira comprando apenas ativos descontados.
        </p>
      </div>

      <Card className="border-gold-500/25">
        <form onSubmit={handleCalculate} className="grid items-end gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="aporte-val" className="mb-1.5 block text-xs font-medium text-slate-300">
              Valor Disponível (R$)
            </label>
            <Input
              id="aporte-val"
              type="number"
              step="0.01"
              min="10"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="aporte-qtd" className="mb-1.5 block text-xs font-medium text-slate-300">
              Máximo de Ativos no Aporte
            </label>
            <Select
              id="aporte-qtd"
              value={numAssets}
              onChange={(e) => setNumAssets(e.target.value)}
            >
              <option value="1">1 Ativo (Foco Máximo)</option>
              <option value="2">2 Ativos</option>
              <option value="3">3 Ativos (Padrão Ouro)</option>
              <option value="4">4 Ativos</option>
              <option value="5">5 Ativos</option>
            </Select>
          </div>

          <div className="flex items-center gap-2 pb-2.5">
            <input
              id="prioritize-res"
              type="checkbox"
              checked={prioritizeReserve}
              onChange={(e) => setPrioritizeReserve(e.target.checked)}
              className="h-4 w-4 accent-amber-400"
            />
            <label htmlFor="prioritize-res" className="text-xs text-slate-300">
              Priorizar Reserva Blindada
            </label>
          </div>

          <Button type="submit" variant="gold" disabled={loading}>
            <Compass className="h-4 w-4" />
            {loading ? 'Calculando...' : 'Gerar Ordens'}
          </Button>
        </form>
      </Card>

      {registeredMsg && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/15 p-3.5 text-xs font-semibold text-emerald-300">
          {registeredMsg}
        </div>
      )}

      {suggestions.length > 0 && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-400" />
              <h2 className="text-base font-bold text-white">Plano de Execução Recomendado</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyWhatsApp}>
                <Copy className="h-3.5 w-3.5 text-gold-400" />
                {copied ? 'Copiado p/ WhatsApp!' : 'Copiar Resumo p/ WhatsApp'}
              </Button>
              <Button variant="emerald" size="sm" onClick={handleRegisterAll} disabled={loading}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Registrar Aportes na Carteira
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {suggestions.map((s, idx) => (
              <div
                key={`${s.ticker}-${idx}`}
                className="rounded-xl border border-slate-800 bg-obsidian-950 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-white">
                    #{idx + 1} {s.ticker}
                  </span>
                  <Badge tone={s.isEmergencyReserve ? 'sky' : 'gold'}>
                    {s.categoria.toUpperCase()}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Quantidade sugerida:</span>
                    <strong className="money-value text-white">{s.cotas} cota(s)</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Cotação base:</span>
                    <span className="money-value text-slate-200">{formatBRL(s.currentPrice)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-sm">
                    <span className="font-semibold text-slate-300">Ordem Total:</span>
                    <strong className="money-value text-gold-400">{formatBRL(s.valorTotal)}</strong>
                  </div>
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                  {s.reason} (Distância: +{formatPercent(s.distance)})
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
