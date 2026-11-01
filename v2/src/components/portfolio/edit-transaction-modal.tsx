'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button, Card, Input, Select } from '@/components/ui/primitives';
import {
  AssetAutocompleteInput,
  type CatalogAssetOption
} from '@/components/portfolio/asset-autocomplete-input';

export interface EditableTransactionItem {
  id: number;
  assetCode: string;
  type: 'buy' | 'sell' | 'event' | string;
  quantity: number;
  price: number;
  totalValue: number;
  executedDate: string;
  notes: string | null;
}

interface EditTransactionModalProps {
  transaction: EditableTransactionItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTransactionModal({
  transaction,
  onClose,
  onSuccess
}: EditTransactionModalProps) {
  const [assetCode, setAssetCode] = useState('');
  const [type, setType] = useState<'buy' | 'sell' | 'event'>('buy');
  const [categoryHint, setCategoryHint] = useState('all');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('0');
  const [executedDate, setExecutedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!transaction) return;
    setAssetCode(transaction.assetCode);
    const normalizedType =
      transaction.type === 'sell' || transaction.type === 'event' ? transaction.type : 'buy';
    setType(normalizedType);
    setQuantity(String(transaction.quantity));
    const unitPrice =
      normalizedType === 'event' && transaction.price === 0 && transaction.totalValue > 0
        ? transaction.totalValue
        : transaction.price;
    setPrice(String(unitPrice));
    setExecutedDate(transaction.executedDate);
    setNotes(transaction.notes || '');
    setError('');
  }, [transaction]);

  if (!transaction) return null;

  const handleSelectCatalogAsset = (asset: CatalogAssetOption) => {
    setAssetCode(asset.code);
    if (asset.category) {
      setCategoryHint(asset.category);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const qtyNum = Number(quantity);
      const priceNum = Number(price);
      const res = await fetch('/api/portfolio/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transaction.id,
          assetCode: assetCode.toUpperCase().trim(),
          type,
          categoryHint: categoryHint === 'all' ? undefined : categoryHint,
          quantity: qtyNum,
          price: priceNum,
          totalValue: Number((qtyNum * priceNum).toFixed(2)),
          executedDate,
          notes: notes.trim() || null
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || 'Não foi possível salvar a edição.');
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
      aria-labelledby="edit-tx-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <Card className="relative w-full max-w-md p-6">
        <button
          type="button"
          aria-label="Fechar edição de lançamento"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="edit-tx-title" className="mb-1 text-lg font-bold text-white">
          Editar Lançamento #{transaction.id}
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Corrija código, quantidade, preço ou data sem gerar venda fictícia na custódia.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="edit-tx-type" className="mb-1 block text-xs text-slate-300">
              Tipo de Movimento
            </label>
            <Select
              id="edit-tx-type"
              value={type}
              onChange={(e) => setType(e.target.value as 'buy' | 'sell' | 'event')}
            >
              <option value="buy">Compra / Aporte</option>
              <option value="sell">Venda / Resgate</option>
              <option value="event">Provento / Dividendo</option>
            </Select>
          </div>

          <div>
            <label htmlFor="edit-tx-ticker" className="mb-1 block text-xs text-slate-300">
              Código / Ticker do Ativo
            </label>
            <AssetAutocompleteInput
              id="edit-tx-ticker"
              value={assetCode}
              categoryFilter={categoryHint}
              onChange={setAssetCode}
              onSelectAsset={handleSelectCatalogAsset}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-tx-qty" className="mb-1 block text-xs text-slate-300">
                Quantidade
              </label>
              <Input
                id="edit-tx-qty"
                type="number"
                step="any"
                min="0.0001"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="edit-tx-price" className="mb-1 block text-xs text-slate-300">
                Preço Unitário
              </label>
              <Input
                id="edit-tx-price"
                type="number"
                step="any"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-tx-date" className="mb-1 block text-xs text-slate-300">
              Data de Liquidação
            </label>
            <Input
              id="edit-tx-date"
              type="date"
              required
              value={executedDate}
              onChange={(e) => setExecutedDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="edit-tx-notes" className="mb-1 block text-xs text-slate-300">
              Observação (Opcional)
            </label>
            <Input
              id="edit-tx-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Correção de nota de corretagem"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold" size="sm" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
