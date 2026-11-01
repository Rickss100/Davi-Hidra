'use client';

import React, { useState } from 'react';
import { GraduationCap, Download, Copy, Check, Share2 } from 'lucide-react';
import { FULL_MANUAL_TEXT, GROWTH_TEMPLATES } from './manual-content';

interface TutorialHeaderProps {
  onFeedback: (msg: string) => void;
}

export function TutorialHeader({ onFeedback }: TutorialHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyManual = () => {
    navigator.clipboard.writeText(FULL_MANUAL_TEXT);
    setCopied(true);
    onFeedback('✓ Manual completo copiado com sucesso! Pronto para colar no NotebookLM ou ChatGPT.');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadManual = () => {
    const element = document.createElement('a');
    const file = new Blob([FULL_MANUAL_TEXT], { type: 'text/markdown;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'MANUAL_NORTE_INVEST_DAVI_HYDRA.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    onFeedback('✓ Download do arquivo MANUAL_NORTE_INVEST_DAVI_HYDRA.md concluído!');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(GROWTH_TEMPLATES[0]?.text ?? '');
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-500/20">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Central de Aprendizado & Tutorial
          </h1>
          <p className="text-xs text-slate-400">
            Aprenda primeiro a metodologia do Investidor Inteligente e, em seguida, domine cada recurso do aplicativo.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleDownloadManual}
          title="Baixar arquivo Markdown do manual"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-[#111c34] px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition-colors"
        >
          <Download className="h-4 w-4 text-slate-300" />
          <span>Baixar Manual (.md)</span>
        </button>

        <button
          type="button"
          onClick={handleCopyManual}
          title="Copiar texto completo para o Google NotebookLM ou IAs de estudo"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? 'Copiado!' : 'Copiar para NotebookLM'}</span>
        </button>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          title="Indicar o método pelo WhatsApp (Boca a Boca)"
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          <span>Indicar no WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
