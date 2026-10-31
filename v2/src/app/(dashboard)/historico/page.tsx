'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Trash2, FileSpreadsheet } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Button, Card, Badge, Skeleton } from '@/components/ui/primitives';
import { formatBRL } from '@/lib/money';

export default function HistoricoPage() {
  const { data, isLoading, refetch } = usePortfolioData();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell' | 'event'>('all');
  const [uploading, setUploading] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');

  if (isLoading || !data) {
    return <Skeleton className="h-96" />;
  }

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setImportFeedback('');

    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));

      const res = await fetch('/api/portfolio/import-b3', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (!res.ok) {
        setImportFeedback(`Erro: ${json.message || 'Falha na importação.'}`);
        return;
      }

      const r = json.report;
      setImportFeedback(
        `✓ ${r.filesProcessed} arquivo(s) B3 processado(s): ${r.insertedCount} novos registros salvos (${r.tradesParsed} operações e ${r.dividendsParsed} proventos identificados; ${r.skippedDuplicates} duplicados ignorados).`
      );
      await refetch();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/portfolio/transactions?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      await refetch();
    }
  };

  const txs = data.snapshot.recentTransactions.filter((t) =>
    filterType === 'all' ? true : t.type === filterType
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Extrato & Importador Oficial B3</h1>
        <p className="text-xs text-slate-400">
          Envie múltiplos relatórios anuais (.xlsx) da Área do Investidor B3 de uma só vez com deduplicação criptográfica SHA-256.
        </p>
      </div>

      {/* Zona Drag & Drop Multi-Arquivo B3 */}
      <Card
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleUploadFiles(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center border-dashed border-gold-500/40 bg-obsidian-900/60 py-8 text-center"
      >
        <FileSpreadsheet className="mb-2 h-9 w-9 text-gold-400" />
        <h2 className="text-sm font-bold text-white">
          Arraste suas planilhas Movimentação B3 (.xlsx) aqui
        </h2>
        <p className="mt-1 max-w-md text-xs text-slate-400">
          Suporta envio simultâneo (ex: 2023.xlsx, 2024.xlsx, 2025.xlsx, 2026.xlsx). Importa automaticamente compras, vendas, dividendos, JCP e rendimentos.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          multiple
          className="hidden"
          onChange={(e) => handleUploadFiles(e.target.files)}
        />

        <Button
          variant="gold"
          size="sm"
          className="mt-4"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <UploadCloud className="h-4 w-4" />
          {uploading ? 'Processando no Servidor...' : 'Selecionar Planilhas B3 (.xlsx)'}
        </Button>

        {importFeedback && (
          <p className="mt-3 text-xs font-semibold text-emerald-400">{importFeedback}</p>
        )}
      </Card>

      {/* Filtros & Tabela */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white">Últimos Lançamentos Auditados</h2>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'buy', label: 'Compras' },
              { id: 'sell', label: 'Vendas' },
              { id: 'event', label: 'Proventos / Dividendos' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id as 'all' | 'buy' | 'sell' | 'event')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  filterType === f.id
                    ? 'bg-gold-500 text-obsidian-950'
                    : 'bg-obsidian-950 text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-2.5 font-semibold">Data</th>
                <th className="pb-2.5 font-semibold">Ativo</th>
                <th className="pb-2.5 font-semibold">Natureza</th>
                <th className="pb-2.5 text-right font-semibold">Qtd</th>
                <th className="pb-2.5 text-right font-semibold">Preço Unit.</th>
                <th className="pb-2.5 text-right font-semibold">Valor Total</th>
                <th className="pb-2.5 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {txs.map((tx) => (
                <tr key={tx.id} className="hover:bg-obsidian-800/40">
                  <td className="money-value py-2.5 text-slate-300">{tx.executedDate}</td>
                  <td className="py-2.5 font-bold text-white">{tx.assetCode}</td>
                  <td className="py-2.5">
                    {tx.type === 'event' ? (
                      <Badge tone="purple">Provento / Dividendo</Badge>
                    ) : tx.type === 'sell' ? (
                      <Badge tone="rose">Venda</Badge>
                    ) : (
                      <Badge tone="emerald">Compra</Badge>
                    )}
                  </td>
                  <td className="money-value py-2.5 text-right text-slate-300">{tx.quantity}</td>
                  <td className="money-value py-2.5 text-right text-slate-300">
                    {formatBRL(tx.price)}
                  </td>
                  <td className="money-value py-2.5 text-right font-semibold text-white">
                    {formatBRL(tx.totalValue)}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      aria-label={`Excluir lançamento ${tx.id}`}
                      onClick={() => handleDelete(tx.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
