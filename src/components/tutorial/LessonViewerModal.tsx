'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Copy,
  Check,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import type { AcademyLesson } from '@/data/academy/curriculum';

interface LessonViewerModalProps {
  lesson: AcademyLesson | null;
  isOpen: boolean;
  onClose: () => void;
  isCompleted: boolean;
  onToggleCompleted: (lessonId: string) => void;
  onNavigateLesson?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function LessonViewerModal({
  lesson,
  isOpen,
  onClose,
  isCompleted,
  onToggleCompleted,
  onNavigateLesson,
  hasPrev,
  hasNext,
}: LessonViewerModalProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lesson) return null;

  const handleCopyPrompt = () => {
    if (!lesson.promptNotebookLM) return;
    navigator.clipboard.writeText(lesson.promptNotebookLM);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  // Renderizador simplificado de Markdown nativo
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = (key: string) => {
      if (tableRows.length > 0) {
        const header = tableRows[0] || [];
        const body = tableRows.slice(1).filter((r) => !r.every((c) => c.includes('---')));
        elements.push(
          <div key={key} className="my-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            <table className="w-full text-left text-xs text-slate-300">
              {header.length > 0 && (
                <thead className="border-b border-slate-800 bg-slate-950/60 text-emerald-400 font-bold">
                  <tr>
                    {header.map((col, idx) => (
                      <th key={idx} className="p-3">
                        {col.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-slate-800/60">
                {body.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3">
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
      inTable = false;
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Bloco de código
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div
              key={`code-${idx}`}
              className="my-5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300"
            >
              <pre>{codeLines.join('\n')}</pre>
            </div>
          );
          codeLines = [];
          inCodeBlock = false;
        } else {
          flushTable(`table-before-code-${idx}`);
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      // Tabela Markdown
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cols = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        tableRows.push(cols);
        return;
      } else if (inTable) {
        flushTable(`table-${idx}`);
      }

      // Separador horizontal
      if (trimmed === '---') {
        elements.push(<hr key={`hr-${idx}`} className="my-6 border-slate-800/80" />);
        return;
      }

      // Títulos
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${idx}`} className="mt-2 mb-4 text-xl sm:text-2xl font-black text-white tracking-tight">
            {trimmed.replace('# ', '')}
          </h1>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${idx}`} className="mt-8 mb-3 text-lg font-bold text-emerald-400 flex items-center gap-2">
            {trimmed.replace('## ', '')}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${idx}`} className="mt-5 mb-2 text-sm font-semibold text-teal-300">
            {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }

      // Citação ou Alerta (Blockquote)
      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/, '');
        const isHighlight =
          quoteText.includes('💡') ||
          quoteText.includes('💎') ||
          quoteText.includes('🛡️') ||
          quoteText.includes('👑');
        const isAlert = quoteText.includes('🚫') || quoteText.includes('⚠️') || quoteText.includes('🚨');

        elements.push(
          <div
            key={`quote-${idx}`}
            className={`my-4 rounded-xl border p-4 text-xs sm:text-sm leading-relaxed ${
              isHighlight
                ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                : isAlert
                ? 'border-rose-500/40 bg-rose-950/20 text-rose-200'
                : 'border-slate-800 bg-slate-900/60 text-slate-300'
            }`}
          >
            {quoteText}
          </div>
        );
        return;
      }

      // Listas
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={`li-${idx}`} className="ml-5 my-1 text-xs sm:text-sm text-slate-300 list-disc leading-relaxed">
            {trimmed.replace(/^[-*]\s*/, '')}
          </li>
        );
        return;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <li key={`oli-${idx}`} className="ml-5 my-1 text-xs sm:text-sm text-slate-300 list-decimal leading-relaxed">
            {trimmed.replace(/^\d+\.\s*/, '')}
          </li>
        );
        return;
      }

      // Parágrafo comum
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${idx}`} className="my-3 text-xs sm:text-sm leading-relaxed text-slate-300">
            {trimmed}
          </p>
        );
      }
    });

    flushTable('table-end');
    return elements;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Cabeçalho do Leitor */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                {lesson.moduloTitulo} • Aula {lesson.numeroAula}
              </p>
              <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">{lesson.titulo}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {lesson.duracaoLeitura}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Fechar leitor de aula"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Corpo da Aula com Scroll Suave */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-2 text-slate-200">
          {renderContent(lesson.content)}

          {/* Card Especial de Áudio / NotebookLM */}
          {lesson.promptNotebookLM && (
            <div className="my-8 rounded-2xl border border-teal-500/30 bg-teal-950/20 p-5 shadow-lg">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-xs sm:text-sm">
                  <Headphones className="h-4 w-4" />
                  <span>Gerar Podcast desta Aula no Google NotebookLM</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300 hover:bg-teal-500/20 transition-all"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Prompt</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80">
                &ldquo;{lesson.promptNotebookLM}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Rodapé Fixo com Ação de Conclusão e Navegação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-900/90 px-5 py-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onToggleCompleted(lesson.id)}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isCompleted
                  ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Aula Concluída ✓</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" />
                  <span>Marcar como Concluída (+3.3%)</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => onNavigateLesson?.('prev')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => onNavigateLesson?.('next')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <span>Próxima</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
