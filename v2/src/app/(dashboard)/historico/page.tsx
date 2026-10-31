'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  History,
  Search,
  DollarSign,
  BarChart3,
  Layers,
  Wallet,
  UploadCloud,
  FileSpreadsheet,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Coins
} from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Button, Card, Badge, Skeleton, Input } from '@/components/ui/primitives';
import { formatBRL } from '@/lib/money';
import {
  EditTransactionModal,
  type EditableTransactionItem
} from '@/components/portfolio/edit-transaction-modal';
import { cn } from '@/lib/utils';

export default function HistoricoPage() {
  const { data, isLoading, refetch } = usePortfolioData();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showImportZone, setShowImportZone] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');
  const [editingTx, setEditingTx] = useState<EditableTransactionItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Cálculos consolidados dos 4 cards de métricas gerais da carteira
  const metrics = useMemo(() => {
    if (!data) {
      return { totalInvested: 0, totalCount: 0, uniqueAssetsCount: 0, avgAporte: 0 };
    }

    const txs = data.snapshot.recentTransactions || [];
    let totalInvested = 0;
    let buyCount = 0;
    const uniqueAssets = new Set<string>();

    txs.forEach((t) => {
      const val = Number(t.totalValue || t.quantity * t.price || 0);
      if (t.type === 'buy') {
        totalInvested += val;
        buyCount++;
      }
      if (t.assetCode) {
        uniqueAssets.add(t.assetCode.toUpperCase());
      }
    });

    const avgAporte = buyCount > 0 ? totalInvested / buyCount : 0;
    const finalTotalInvested = totalInvested > 0 ? totalInvested : data.snapshot.totalInvestedBrl;
    const finalUniqueCount =
      uniqueAssets.size > 0 ? uniqueAssets.size : data.snapshot.flatHoldings.length;

    return {
      totalInvested: finalTotalInvested,
      totalCount: txs.length,
      uniqueAssetsCount: finalUniqueCount,
      avgAporte
    };
  }, [data]);

  // Transações filtradas e ordenadas dinamicamente
  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    const list = data.snapshot.recentTransactions || [];

    return list
      .filter((t) => {
        // Busca textual por código do ativo ou notas/observações
        const query = searchTerm.trim().toLowerCase();
        const matchSearch =
          !query ||
          t.assetCode.toLowerCase().includes(query) ||
          (t.assetName && t.assetName.toLowerCase().includes(query)) ||
          (t.notes && t.notes.toLowerCase().includes(query));

        // Filtro por Classe / Categoria
        let matchCat = true;
        if (filterCategory !== 'ALL') {
          const cat = (t.category || '').toLowerCase();
          const type = (t.assetType || '').toLowerCase();
          const code = t.assetCode.toUpperCase();

          if (filterCategory === 'acoes') {
            matchCat =
              cat === 'acoes' ||
              type.includes('ação') ||
              type.includes('acao') ||
              (!code.endsWith('11') && !code.includes('TESOURO') && !code.includes('CDB'));
          } else if (filterCategory === 'fiis') {
            matchCat =
              cat === 'fiis' ||
              type.includes('fii') ||
              type.includes('imob') ||
              /^[A-Z]{4}11B?$/.test(code);
          } else if (filterCategory === 'stocks') {
            matchCat = cat === 'stocks' || type.includes('stock');
          } else if (filterCategory === 'reits') {
            matchCat = cat === 'reits' || type.includes('reit');
          } else if (filterCategory === 'fixed') {
            matchCat =
              cat === 'fixed' ||
              type.includes('fixa') ||
              type.includes('tesouro') ||
              code.includes('SELIC') ||
              code.includes('CDB');
          }
        }

        // Filtro por Tipo de Operação
        let matchType = true;
        if (filterType !== 'ALL') {
          matchType = t.type === filterType;
        }

        return matchSearch && matchCat && matchType;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.executedDate).getTime() - new Date(a.executedDate).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.executedDate).getTime() - new Date(b.executedDate).getTime();
        }
        if (sortBy === 'value-desc') {
          const vA = Number(a.totalValue || a.quantity * a.price || 0);
          const vB = Number(b.totalValue || b.quantity * b.price || 0);
          return vB - vA;
        }
        if (sortBy === 'value-asc') {
          const vA = Number(a.totalValue || a.quantity * a.price || 0);
          const vB = Number(b.totalValue || b.quantity * b.price || 0);
          return vA - vB;
        }
        return 0;
      });
  }, [data, searchTerm, filterCategory, filterType, sortBy]);

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
      setConfirmDeleteId(null);
      await refetch();
    }
  };

  const formatAssetClassBadge = (cat?: string, type?: string, code?: string) => {
    const upperCode = (code || '').toUpperCase();
    if (
      cat === 'fixed' ||
      upperCode.includes('TESOURO') ||
      upperCode.includes('SELIC') ||
      upperCode.includes('CDB')
    ) {
      return (
        <Badge tone="slate" className="text-[10px] px-1.5 py-0.5 font-bold uppercase">
          Renda Fixa
        </Badge>
      );
    }
    if (cat === 'fiis' || /^[A-Z]{4}11B?$/.test(upperCode)) {
      return (
        <Badge tone="purple" className="text-[10px] px-1.5 py-0.5 font-bold uppercase">
          FII
        </Badge>
      );
    }
    if (cat === 'stocks') {
      return (
        <Badge tone="gold" className="text-[10px] px-1.5 py-0.5 font-bold uppercase">
          Stock
        </Badge>
      );
    }
    if (cat === 'reits') {
      return (
        <Badge tone="purple" className="text-[10px] px-1.5 py-0.5 font-bold uppercase">
          REIT
        </Badge>
      );
    }
    return (
      <Badge tone="emerald" className="text-[10px] px-1.5 py-0.5 font-bold uppercase">
        Ação
      </Badge>
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header com Título & Ação de Importar B3 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white sm:text-2xl lg:text-3xl">
                Histórico de Aportes & Transações
              </h1>
              <p className="text-xs text-slate-300 sm:text-sm">
                Consulte todos os seus registros de compras, vendas e movimentações patrimoniais.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant={showImportZone ? 'gold' : 'outline'}
          size="sm"
          onClick={() => setShowImportZone(!showImportZone)}
          className="h-10 gap-2 text-xs font-bold sm:text-sm"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {showImportZone ? 'Fechar Importador' : 'Importar Planilhas B3 (.xlsx)'}
        </Button>
      </div>

      {/* Zona Retrátil Drag & Drop Multi-Arquivo B3 */}
      {showImportZone && (
        <Card
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleUploadFiles(e.dataTransfer.files);
          }}
          className="flex flex-col items-center justify-center border-dashed border-gold-500/50 bg-obsidian-950/80 py-7 text-center transition-all shadow-xl"
        >
          <FileSpreadsheet className="mb-2 h-9 w-9 text-gold-400" />
          <h2 className="text-sm font-bold text-white sm:text-base">
            Arraste suas planilhas de Movimentação B3 (.xlsx) aqui
          </h2>
          <p className="mt-1 max-w-lg text-xs text-slate-400 sm:text-sm">
            Envio simultâneo suportado (ex: 2023.xlsx, 2024.xlsx, 2025.xlsx, 2026.xlsx). Identifica compras, vendas, dividendos, JCP e ignora duplicatas com hash criptográfico SHA-256.
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
            <p className="mt-3 text-xs font-semibold text-emerald-400 sm:text-sm">
              {importFeedback}
            </p>
          )}
        </Card>
      )}

      {/* Os 4 Cards de Métricas Gerais da Carteira (Grid 4 Colunas Perfeito) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Total em Aportes */}
        <Card className="border border-slate-800 bg-obsidian-950/80 p-4 transition-all hover:border-slate-700 sm:p-5">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span>Total em Aportes</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="money-value mt-2 text-xl font-black text-emerald-400 sm:text-2xl lg:text-3xl">
            {formatBRL(metrics.totalInvested)}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            Capital total alocado em compras
          </div>
        </Card>

        {/* Card 2: Operações Registradas */}
        <Card className="border border-slate-800 bg-obsidian-950/80 p-4 transition-all hover:border-slate-700 sm:p-5">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span>Operações Registradas</span>
            <BarChart3 className="h-4 w-4 text-sky-400" />
          </div>
          <div className="money-value mt-2 text-xl font-black text-white sm:text-2xl lg:text-3xl">
            {metrics.totalCount}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            Total de transações executadas
          </div>
        </Card>

        {/* Card 3: Ativos Distintos */}
        <Card className="border border-slate-800 bg-obsidian-950/80 p-4 transition-all hover:border-slate-700 sm:p-5">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span>Ativos Distintos</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <div className="money-value mt-2 text-xl font-black text-white sm:text-2xl lg:text-3xl">
            {metrics.uniqueAssetsCount}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            Ativos com movimentação
          </div>
        </Card>

        {/* Card 4: Média por Aporte */}
        <Card className="border border-slate-800 bg-obsidian-950/80 p-4 transition-all hover:border-slate-700 sm:p-5">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span>Média por Aporte</span>
            <Wallet className="h-4 w-4 text-gold-400" />
          </div>
          <div className="money-value mt-2 text-xl font-black text-white sm:text-2xl lg:text-3xl">
            {formatBRL(metrics.avgAporte)}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            Média dos aportes de compra
          </div>
        </Card>
      </div>

      {/* Barra de Filtros e Busca Completa */}
      <Card className="border border-slate-800 bg-obsidian-950/90 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Input de Busca */}
          <div className="relative w-full flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código ou anotação (ex: PETR4, Tesouro)..."
              className="h-10 pl-9 text-xs sm:text-sm bg-obsidian-900 border-slate-700/80"
            />
          </div>

          {/* Grupo de Filtros Select */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Select Categoria */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-10 rounded-xl border border-slate-700/80 bg-obsidian-900 px-3 text-xs font-semibold text-slate-200 focus:border-gold-500 focus:outline-none"
            >
              <option value="ALL">Todas as Classes</option>
              <option value="acoes">Ações BR</option>
              <option value="fiis">Fundos Imobiliários</option>
              <option value="stocks">Stocks (EUA)</option>
              <option value="reits">REITs (EUA)</option>
              <option value="fixed">Renda Fixa</option>
            </select>

            {/* Select Tipo de Operação */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 rounded-xl border border-slate-700/80 bg-obsidian-900 px-3 text-xs font-semibold text-slate-200 focus:border-gold-500 focus:outline-none"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="buy">Aportes / Compras</option>
              <option value="sell">Resgates / Vendas</option>
              <option value="event">Proventos / Dividendos</option>
            </select>

            {/* Select Ordenação */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-xl border border-slate-700/80 bg-obsidian-900 px-3 text-xs font-semibold text-slate-200 focus:border-gold-500 focus:outline-none"
            >
              <option value="date-desc">Mais recentes primeiro</option>
              <option value="date-asc">Mais antigas primeiro</option>
              <option value="value-desc">Maior valor primeiro</option>
              <option value="value-asc">Menor valor primeiro</option>
            </select>

            {/* Contador de Operações Filtradas */}
            <div className="text-xs font-semibold text-slate-400 whitespace-nowrap px-1">
              <span className="font-extrabold text-white">{filteredTransactions.length}</span> de{' '}
              {data.snapshot.recentTransactions.length} operações
            </div>
          </div>
        </div>
      </Card>

      {/* Tabela de Transações */}
      <Card className="overflow-hidden border border-slate-800 p-0 shadow-xl">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-obsidian-950 text-xs font-extrabold uppercase tracking-wider text-slate-300">
              <tr>
                <th className="px-4 py-3.5 whitespace-nowrap">Data</th>
                <th className="px-3 py-3.5 whitespace-nowrap">Tipo</th>
                <th className="px-3 py-3.5 whitespace-nowrap">Ativo</th>
                <th className="px-3 py-3.5 text-right whitespace-nowrap">Quantidade</th>
                <th className="px-3 py-3.5 text-right whitespace-nowrap">Preço Unitário</th>
                <th className="px-3 py-3.5 text-right whitespace-nowrap">Total da Operação</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Observações</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 bg-obsidian-950/40">
              {filteredTransactions.map((tx) => {
                const isBuy = tx.type === 'buy';
                const isSell = tx.type === 'sell';
                const isEvent = tx.type === 'event';

                return (
                  <tr key={tx.id} className="hover:bg-obsidian-800/40 transition-colors">
                    {/* Data formatada */}
                    <td className="money-value px-4 py-3 font-medium text-slate-300 whitespace-nowrap">
                      {tx.executedDate}
                    </td>

                    {/* Tipo de Operação com Badge */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {isBuy ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                          <ArrowDownLeft className="h-3 w-3" />
                          Compra / Aporte
                        </span>
                      ) : isSell ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-400">
                          <ArrowUpRight className="h-3 w-3" />
                          Venda / Resgate
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-300">
                          <Coins className="h-3 w-3" />
                          Provento
                        </span>
                      )}
                    </td>

                    {/* Ativo + Classe + Nome */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">
                          {tx.assetCode}
                        </span>
                        {formatAssetClassBadge(tx.category, tx.assetType, tx.assetCode)}
                      </div>
                      {tx.assetName && tx.assetName.toUpperCase() !== tx.assetCode.toUpperCase() && (
                        <span className="block max-w-[180px] truncate text-[11px] text-slate-400">
                          {tx.assetName}
                        </span>
                      )}
                    </td>

                    {/* Quantidade */}
                    <td className="money-value px-3 py-3 text-right font-medium text-slate-200 whitespace-nowrap">
                      {tx.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
                    </td>

                    {/* Preço Unitário */}
                    <td className="money-value px-3 py-3 text-right text-slate-300 whitespace-nowrap">
                      {formatBRL(tx.price)}
                    </td>

                    {/* Total da Operação */}
                    <td
                      className={cn(
                        'money-value px-3 py-3 text-right font-bold whitespace-nowrap',
                        isSell ? 'text-rose-400' : 'text-emerald-400'
                      )}
                    >
                      {isSell ? `- ${formatBRL(tx.totalValue)}` : `+ ${formatBRL(tx.totalValue)}`}
                    </td>

                    {/* Observações */}
                    <td className="px-4 py-3 text-xs text-slate-300 max-w-[240px] truncate">
                      {tx.notes || '—'}
                    </td>

                    {/* Ações (Editar & Excluir) */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {confirmDeleteId === tx.id ? (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id)}
                            className="rounded bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-rose-400"
                          >
                            Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:text-white"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title={`Editar lançamento ${tx.id}`}
                            aria-label={`Editar lançamento ${tx.id}`}
                            onClick={() => setEditingTx(tx)}
                            className="rounded-md border border-slate-700/80 bg-obsidian-950 p-1.5 text-slate-300 hover:border-gold-500/50 hover:text-gold-300"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title={`Excluir lançamento ${tx.id}`}
                            aria-label={`Excluir lançamento ${tx.id}`}
                            onClick={() => setConfirmDeleteId(tx.id)}
                            className="rounded-md border border-slate-700/80 bg-obsidian-950 p-1.5 text-slate-400 hover:border-rose-500/50 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-300 sm:text-base">
              Nenhuma transação encontrada para os filtros selecionados.
            </div>
          )}
        </div>
      </Card>

      <EditTransactionModal
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
