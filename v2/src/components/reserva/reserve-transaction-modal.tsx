'use client';

import React, { useEffect, useState } from 'react';
import { MinusCircle, PlusCircle, X } from 'lucide-react';
import { Button, Card, Input, Select } from '@/components/ui/primitives';
import { d, formatBRL, roundCurrency } from '@/lib/money';
import { resolveAssetDisplayName } from '@/lib/asset-names';
import type { HoldingPosition } from '@/server/engines/davi-hydra.engine';

interface ReserveTransactionModalProps {
  mode: 'aporte' | 'resgate' | null;
  reserveAssets: HoldingPosition[];
  onClose: () => void;
  onSuccess: (feedback: string) => Promise<void>;
}

const APORTE_OPTIONS = [
  { code: 'TESOURO_SELIC_2029', label: 'Tesouro Selic 2029 (Risco Soberano D+1)' },
  { code: 'CDB_LIQ_DIARIA', label: 'CDB 100% CDI com Liquidez Diária (Garantia FGC)' },
  { code: 'CONTA_REMUNERADA_CDI', label: 'Conta Digital Remunerada 100% CDI (Liquidez D+0)' }
];

export function ReserveTransactionModal({
  mode,
  reserveAssets,
  onClose,
  onSuccess
}: ReserveTransactionModalProps) {
  const [selectedCode, setSelectedCode] = useState('TESOURO_SELIC_2029');
  const [amountStr, setAmountStr] = useState('');
  const [executedDate, setExecutedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!mode) return;
    setErrorMsg('');
    setAmountStr('');
    setNotes('');
    setExecutedDate(new Date().toISOString().slice(0, 10));

    if (mode === 'resgate' && reserveAssets.length > 0) {
      setSelectedCode(reserveAssets[0]!.code);
    } else {
      setSelectedCode('TESOURO_SELIC_2029');
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, reserveAssets, onClose]);

  if (!mode) return null;

  const isAporte = mode === 'aporte';

  const parseAmount = (raw: string): number => {
    const cleaned = raw.trim().replace(/\./g, '').replace(',', '.');
    const num = Number(raw.includes(',') ? cleaned : raw);
    return Number.isFinite(num) ? roundCurrency(num) : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const val = parseAmount(amountStr);
    if (val <= 0) {
      setErrorMsg('Informe um valor em Reais maior que R$ 0,00.');
      return;
    }

    let quantity = val;
    let unitPrice = 1;

    if (!isAporte) {
      const targetHolding = reserveAssets.find(
        (a) => a.code.toUpperCase() === selectedCode.toUpperCase()
      );
      if (!targetHolding) {
        setErrorMsg('Selecione um ativo com saldo disponível na reserva para resgatar.');
        return;
      }
      if (d(val).greaterThan(d(targetHolding.currentValueBrl).plus('0.01'))) {
        setErrorMsg(
          `O valor informado excede o saldo disponível neste título (${formatBRL(targetHolding.currentValueBrl)}).`
        );
        return;
      }

      const refPrice = d(targetHolding.currentPrice > 0 ? targetHolding.currentPrice : 1);
      unitPrice = roundCurrency(refPrice);
      quantity = Number(d(val).div(refPrice).toFixed(6));
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetCode: selectedCode,
          type: isAporte ? 'buy' : 'sell',
          categoryHint: 'fixed',
          marketHint: 'BR',
          quantity,
          price: unitPrice,
          totalValue: val,
          executedDate,
          notes:
            notes.trim() ||
            (isAporte ? 'Aporte na Reserva de Emergência' : 'Resgate da Reserva de Emergência')
        })
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json.message || 'Não foi possível registrar a operação.');
        return;
      }

      await onSuccess(
        isAporte
          ? `✓ Aporte de ${formatBRL(val)} registrado na sua Reserva de Emergência!`
          : `✓ Resgate de ${formatBRL(val)} registrado na sua Reserva de Emergência.`
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-tx-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <Card className="w-full max-w-lg space-y-5 border-gold-500/40 bg-[#0B0F1A] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            {isAporte ? (
              <PlusCircle className="h-6 w-6 text-emerald-400" />
            ) : (
              <MinusCircle className="h-6 w-6 text-rose-400" />
            )}
            <h2 id="reserve-tx-modal-title" className="text-lg font-extrabold text-white sm:text-xl">
              {isAporte ? 'Novo Aporte na Reserva' : 'Registrar Resgate da Reserva'}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Fechar janela"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-obsidian-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isAporte && reserveAssets.length === 0 ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-amber-400/50 bg-[#191407] p-4 text-sm leading-relaxed text-slate-100">
              Você ainda não possui títulos de liquidez cadastrados na custódia para resgatar. Caso
              seu saldo esteja no campo <strong className="text-amber-300">Conta Externa D+0</strong>,
              basta atualizar o valor diretamente no planejamento da página.
            </p>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="res-tx-asset" className="mb-1.5 block text-sm font-bold text-slate-100">
                {isAporte ? 'Onde você guardou este valor?' : 'De qual título foi o resgate?'}
              </label>
              <Select
                id="res-tx-asset"
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="h-11 text-sm font-bold text-white sm:text-base"
              >
                {isAporte
                  ? APORTE_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))
                  : reserveAssets.map((asset) => (
                      <option key={asset.code} value={asset.code}>
                        {resolveAssetDisplayName(asset.code, asset.name)} — Saldo:{' '}
                        {formatBRL(asset.currentValueBrl)}
                      </option>
                    ))}
              </Select>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="res-tx-val" className="mb-1.5 block text-sm font-bold text-slate-100">
                  {isAporte ? 'Valor do Aporte (R$)' : 'Valor Resgatado (R$)'}
                </label>
                <Input
                  id="res-tx-val"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 1000,00"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="money-value h-11 text-base font-extrabold text-white"
                />
              </div>

              <div>
                <label htmlFor="res-tx-date" className="mb-1.5 block text-sm font-bold text-slate-100">
                  Data da Operação
                </label>
                <Input
                  id="res-tx-date"
                  type="date"
                  required
                  value={executedDate}
                  onChange={(e) => setExecutedDate(e.target.value)}
                  className="h-11 text-sm font-bold text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="res-tx-notes" className="mb-1.5 block text-sm font-bold text-slate-100">
                Observação (Opcional)
              </label>
              <Input
                id="res-tx-notes"
                type="text"
                placeholder={
                  isAporte
                    ? 'Ex: Aporte mensal na reserva de segurança'
                    : 'Ex: Imprevisto médico / manutenção urgente'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-11 text-sm text-white"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/50 bg-[#1f0a10] p-3.5 text-sm font-semibold text-rose-200">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="lg" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant={isAporte ? 'emerald' : 'danger'}
                size="lg"
                disabled={submitting}
                className="font-extrabold"
              >
                {submitting
                  ? 'Salvando...'
                  : isAporte
                    ? 'Confirmar Aporte'
                    : 'Confirmar Resgate'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
