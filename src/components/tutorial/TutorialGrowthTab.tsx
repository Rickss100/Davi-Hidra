'use client';

import React, { useState } from 'react';
import { Share2, MessageCircle, Copy, Check, ExternalLink, Sparkles, Send } from 'lucide-react';
import { GROWTH_TEMPLATES } from './manual-content';

interface TutorialGrowthTabProps {
  onFeedback: (msg: string) => void;
}

export function TutorialGrowthTab({ onFeedback }: TutorialGrowthTabProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    onFeedback('✓ Conteúdo copiado com sucesso! Pronto para postar ou enviar.');
    setTimeout(() => setCopiedIndex(null), 3000);
  };

  const handleOpenWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d1527] to-[#131f3b] p-6 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              Efeito de Rede & Parcerias
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Divulgação & Indicação Boca a Boca: Multiplique o Conhecimento
          </h2>
          <p className="text-xs leading-relaxed text-slate-300">
            A melhor forma de proteger amigos, familiares e clientes das armadilhas da especulação financeira é ensinando a metodologia sólida. Use os roteiros e mensagens prontas abaixo para indicar e compartilhar em um clique.
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Share2 className="h-7 w-7" />
        </div>
      </div>

      {/* Templates de Canais */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {GROWTH_TEMPLATES.map((tmpl, idx) => {
          const isCopied = copiedIndex === idx;
          const isWhatsApp = tmpl.channel.includes('WhatsApp');

          return (
            <div
              key={tmpl.channel}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0d1527] p-5 shadow-sm hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      tmpl.tone === 'emerald'
                        ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : tmpl.tone === 'sky'
                          ? 'border border-sky-500/40 bg-sky-500/10 text-sky-400'
                          : 'border border-amber-500/40 bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {tmpl.badge}
                  </span>
                  {isWhatsApp && <MessageCircle className="h-4 w-4 text-emerald-400" />}
                </div>

                <h3 className="mb-2 text-sm font-bold text-white">{tmpl.channel}</h3>

                <div className="rounded-xl border border-slate-800/90 bg-[#111c34] p-3 text-xs leading-relaxed text-slate-300 whitespace-pre-line max-h-56 overflow-y-auto">
                  {tmpl.text}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(tmpl.text, idx)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#111c34] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>

                {isWhatsApp && (
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(tmpl.text)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all"
                    title="Enviar direto pelo WhatsApp Web ou App"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Dica de Ouro de Compartilhamento */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-[#0d1527] to-[#0f172a] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Dica de Ouro para Consultores e Investidores</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ao gerar o podcast no NotebookLM usando nosso manual, você pode baixar o arquivo de áudio <code>.mp3</code> ou <code>.wav</code> e compartilhá-lo diretamente nos seus grupos de família, amigos ou clientes. O formato de conversa em áudio tem uma taxa de retenção até 5x maior que textos tradicionais!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
