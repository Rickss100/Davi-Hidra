'use client';

import React, { useState } from 'react';
import { Headphones, ExternalLink, Copy, Check, Sparkles, Bot, BookOpen } from 'lucide-react';
import { PROMPTS_IA, FULL_MANUAL_TEXT } from './manual-content';

interface TutorialNotebookLMTabProps {
  onFeedback: (msg: string) => void;
}

export function TutorialNotebookLMTab({ onFeedback }: TutorialNotebookLMTabProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedManual, setCopiedManual] = useState(false);

  const handleCopyPrompt = (promptText: string, index: number) => {
    navigator.clipboard.writeText(promptText);
    setCopiedIndex(index);
    onFeedback('✓ Prompt copiado para a área de transferência!');
    setTimeout(() => setCopiedIndex(null), 3000);
  };

  const handleCopyManual = () => {
    navigator.clipboard.writeText(FULL_MANUAL_TEXT);
    setCopiedManual(true);
    onFeedback('✓ Manual completo copiado! Cole como fonte no NotebookLM.');
    setTimeout(() => setCopiedManual(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Apresentação */}
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d1527] to-[#131f3b] p-6 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              Facilitador de Estudo com IA
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Transforme este Manual em um Podcast e Assistente de Áudio com o Google NotebookLM
          </h2>
          <p className="text-xs leading-relaxed text-slate-300">
            O Google NotebookLM é uma inteligência artificial gratuita capaz de ler nosso manual técnico e transformá-lo em uma conversa de rádio/podcast empolgante em áudio hiper-realista entre dois apresentadores.
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Headphones className="h-7 w-7" />
        </div>
      </div>

      {/* Grid de 4 Passos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Passo 1 */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#0d1527] p-5 shadow-sm">
          <div>
            <div className="mb-2">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Passo 1
              </span>
            </div>
            <h3 className="mb-1 text-sm font-bold text-white">Copie o Manual Oficial</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O manual completo contém todas as regras, a matemática do AM2O e a filosofia de Michelangelo.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyManual}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all"
          >
            {copiedManual ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedManual ? 'Copiado!' : 'Copiar Manual (.md)'}</span>
          </button>
        </div>

        {/* Passo 2 */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#0d1527] p-5 shadow-sm">
          <div>
            <div className="mb-2">
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                Passo 2
              </span>
            </div>
            <h3 className="mb-1 text-sm font-bold text-white">Abra o NotebookLM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acesse o site oficial do Google NotebookLM com sua conta Google e crie um caderno novo.
            </p>
          </div>
          <a
            href="https://notebooklm.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all"
          >
            <span>Acessar NotebookLM</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Passo 3 */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#0d1527] p-5 shadow-sm">
          <div>
            <div className="mb-2">
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Passo 3
              </span>
            </div>
            <h3 className="mb-1 text-sm font-bold text-white">Cole o Texto como Fonte</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No NotebookLM, clique em &quot;Add source&quot; (Adicionar fonte), selecione &quot;Copied text&quot; e cole o manual.
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-center text-xs font-semibold text-purple-300">
            Fonte 100% pronta
          </div>
        </div>

        {/* Passo 4 */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#0d1527] p-5 shadow-sm">
          <div>
            <div className="mb-2">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Passo 4
              </span>
            </div>
            <h3 className="mb-1 text-sm font-bold text-white">Gere o Podcast em Áudio</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clique em &quot;Generate&quot; no bloco &quot;Audio Overview&quot; e ouça um debate completo em áudio imersivo.
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-semibold text-amber-300">
            Áudio pronto em 3 min
          </div>
        </div>
      </div>

      {/* Prompts Prontos para IAs */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-400" />
            Prompts Estruturados para IAs (NotebookLM, ChatGPT, Claude e Gemini)
          </h3>
          <p className="text-xs text-slate-400">
            Copie esses prompts prontos para turbinar seu estudo, criar simulados ou gerar conteúdos educativos:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {PROMPTS_IA.map((p, idx) => {
            const isCopied = copiedIndex === idx;
            return (
              <div
                key={p.title}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0d1527] p-5 shadow-sm"
              >
                <div>
                  <h4 className="mb-1 text-sm font-bold text-white">{p.title}</h4>
                  <p className="mb-3 text-[11px] text-slate-400">{p.description}</p>
                  <div className="rounded-xl border border-slate-800/90 bg-[#111c34] p-3 font-mono text-[11px] text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                    {p.prompt}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyPrompt(p.prompt, idx)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-[#111c34] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{isCopied ? 'Prompt Copiado!' : 'Copiar Prompt'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
