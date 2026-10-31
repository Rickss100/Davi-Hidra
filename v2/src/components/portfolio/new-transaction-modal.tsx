'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Card, Input, Select } from '@/components/ui/primitives';

interface NewTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewTransactionModal({ open, onClose, onSuccess }: NewTransactionModalProps) {
  const [assetCode, setAssetCode] = useState('');
  const [type, setType] = useState<'buy' | 'sell' | 'event'>('buy');
  const [categoryHint, setCategoryHint] = useState('acoes');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [executedDate, setExecutedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const qtyNum = Number(quantity);
      const priceNum = Number(price);
      const res = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetCode: assetCode.toUpperCase().trim(),
          type,
          categoryHint,
          quantity: qtyNum,
          price: priceNum,
          totalValue: Number((qtyNum * priceNum).toFixed(2)),
          executedDate,
          notes
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Erro ao registrar operação.');
        return;
      }
      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <Card className="relative w-full max-w-md p-6">
        <button
          type="button"
          aria-label="Fechar modal"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="tx-modal-title" className="mb-4 text-lg font-bold text-white">
          Registrar Operação na Custódia
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-type" className="mb-1 block text-xs text-slate-300">
                Tipo de Movimento
              </label>
              <Select
                id="tx-type"
                value={type}
                onChange={(e) => setType(e.target.value as 'buy' | 'sell' | 'event')}
              >
                <option value="buy">Compra / Aporte</option>
                <option value="sell">Venda / Resgate</option>
                <option value="event">Provento / Dividendo</option>
              </Select>
            </div>
            <div>
              <label htmlFor="tx-cat" className="mb-1 block text-xs text-slate-300">
                Classe do Ativo
              </label>
              <Select
                id="tx-cat"
                value={categoryHint}
                onChange={(e) => setCategoryHint(e.target.value)}
              >
                <option value="acoes">Ações BR</option>
                <option value="fiis">FIIs BR</option>
                <option value="fixed">Renda Fixa</option>
                <option value="stocks">Stocks EUA</option>
                <option value="reits">REITs EUA</option>
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="tx-ticker" className="mb-1 block text-xs text-slate-300">
              Código / Ticker do Ativo
            </label>
            <Input
              id="tx-ticker"
              required
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
              placeholder="Ex: WEGE3, HGLG11, Tesouro Selic 2029"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-qty" className="mb-1 block text-xs text-slate-300">
                Quantidade
              </label>
              <Input
                id="tx-qty"
                type="number"
                step="any"
                min="0.0001"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tx-price" className="mb-1 block text-xs text-slate-300">
                Preço Unitário
              </label>
              <Input
                id="tx-price"
                type="number"
                step="any"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tx-date" className="mb-1 block text-xs text-slate-300">
              Data de Liquidação
            </label>
            <Input
              id="tx-date"
              type="date"
              required
              value={executedDate}
              onChange={(e) => setExecutedDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="tx-notes" className="mb-1 block text-xs text-slate-300">
              Observação (Opcional)
            </label>
            <Input
              id="tx-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Nota de corretagem XP / BTG"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <Button type="submit" variant="gold" className="w-full" disabled={saving}>
            {saving ? 'Gravando no PostgreSQL...' : 'Confirmar Registro'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
