'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui/primitives';

interface B3ImportReport {
  filesProcessed: number;
  tradesParsed: number;
  dividendsParsed: number;
  insertedCount: number;
  skippedDuplicates: number;
}

interface B3ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function B3ImportModal({ open, onClose, onSuccess }: B3ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<B3ImportReport | null>(null);

  if (!open) return null;

  const handleFileSelection = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.xlsx'));
    if (valid.length === 0) {
      setError('Por favor, selecione arquivos com extensão .xlsx exportados da B3.');
      return;
    }
    setError('');
    setReport(null);
    setSelectedFiles(valid);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/portfolio/import-b3', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Falha ao importar as planilhas da B3.');
        return;
      }

      setReport(data.report);
      onSuccess();
    } catch {
      setError('Erro de conexão ao enviar arquivos para o servidor.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setReport(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="b3-import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/80 p-4 backdrop-blur-sm"
    >
      <Card className="relative w-full max-w-2xl border-slate-800 bg-obsidian-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar importador"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-obsidian-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 id="b3-import-modal-title" className="text-lg font-bold text-white">
              Importador Oficial B3 (.xlsx)
            </h2>
            <p className="text-xs text-slate-400">
              Sincronize sua carteira direto do Extrato de Movimentação da B3 em 1 clique
            </p>
          </div>
        </div>

        {/* Guia Rápido */}
        <div className="my-4 rounded-xl border border-slate-800 bg-obsidian-950/60 p-3.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold text-gold-400">
            <Info className="h-4 w-4" />
            <span>Como exportar suas notas da B3:</span>
          </div>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-slate-400">
            <li>
              Acesse a <strong className="text-slate-200">Área do Investidor B3</strong> (investidor.b3.com.br).
            </li>
            <li>
              Vá em <strong className="text-slate-200">Extratos &gt; Movimentação</strong> e selecione o período desejado.
            </li>
            <li>
              Clique em <strong className="text-slate-200">Exportar (Excel .xlsx)</strong> e solte os arquivos abaixo.
            </li>
          </ol>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {report ? (
          /* Relatório de Importação Concluída */
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Importação Concluída com Sucesso!</h3>
                <p className="text-xs text-emerald-400/90">
                  Os lançamentos foram integrados e o Preço Médio Ponderado foi recalculado.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-obsidian-950 p-3 text-center">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Arquivos</span>
                <p className="text-lg font-bold text-white">{report.filesProcessed}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-obsidian-950 p-3 text-center">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Operações</span>
                <p className="text-lg font-bold text-emerald-400">+{report.tradesParsed}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-obsidian-950 p-3 text-center">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Proventos</span>
                <p className="text-lg font-bold text-gold-400">+{report.dividendsParsed}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-obsidian-950 p-3 text-center">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Duplicados</span>
                <p className="text-lg font-bold text-slate-400">{report.skippedDuplicates}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Importar Outros Arquivos
              </Button>
              <Button variant="gold" size="sm" onClick={onClose} className="gap-2">
                Ver Carteira Atualizada
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Zona de Drop & Seleção */
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileSelection(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                isDragging
                  ? 'border-gold-400 bg-gold-500/10'
                  : 'border-slate-700 bg-obsidian-950/60 hover:border-slate-600'
              }`}
            >
              <UploadCloud
                className={`h-10 w-10 mb-2 ${
                  isDragging ? 'text-gold-400 animate-bounce' : 'text-slate-400'
                }`}
              />
              <p className="text-sm font-semibold text-white">
                Arraste suas planilhas de movimentação da B3 aqui
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Suporta múltiplos arquivos simultâneos (ex: 2023.xlsx, 2024.xlsx, 2025.xlsx)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelection(e.target.files)}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                Selecionar do Computador
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Layers className="h-3.5 w-3.5 text-gold-400" />
                    {selectedFiles.length} arquivo(s) selecionado(s):
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Limpar
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-obsidian-950 px-3 py-1.5 text-xs"
                    >
                      <span className="truncate text-slate-200">{file.name}</span>
                      <Badge tone="slate">{(file.size / 1024).toFixed(1)} KB</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={uploading}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="gold"
                size="sm"
                disabled={selectedFiles.length === 0 || uploading}
                onClick={handleUpload}
                className="gap-2"
              >
                <UploadCloud className="h-4 w-4" />
                {uploading ? 'Processando Planilhas...' : 'Processar e Sincronizar'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
