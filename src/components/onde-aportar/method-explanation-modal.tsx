'use client';

import React, { useEffect, useState } from 'react';
import { Compass, ShieldCheck, Scale, Sparkles, X } from 'lucide-react';
import { Button, Card } from '@/components/ui/primitives';

export const HIDE_METHOD_MODAL_KEY = 'norte_v2_hide_am2o_modal';

interface MethodExplanationModalProps {
  open: boolean;
  onClose: () => void;
}

export function MethodExplanationModal({ open, onClose }: MethodExplanationModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDontShowAgain(localStorage.getItem(HIDE_METHOD_MODAL_KEY) === 'true');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleToggleDontShow = (checked: boolean) => {
    setDontShowAgain(checked);
    if (checked) {
      localStorage.setItem(HIDE_METHOD_MODAL_KEY, 'true');
    } else {
      localStorage.removeItem(HIDE_METHOD_MODAL_KEY);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="method-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <Card className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto border-gold-500/45 bg-[#0B0F1A] p-0 shadow-2xl">
        {/* Cabeçalho Destacado e Legível */}
        <div className="flex items-start justify-between gap-4 border-b border-gold-500/25 bg-gradient-to-r from-gold-500/15 via-obsidian-900 to-obsidian-900 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold-500/45 bg-gold-500/20 text-gold-300">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h2
                id="method-modal-title"
                className="text-xl font-extrabold leading-snug text-white sm:text-2xl"
              >
                Explicação do Método DAVI & Hydra
              </h2>
              <p className="mt-0.5 text-sm font-semibold text-gold-300">
                Equilíbrio Matemático de Carteira (AM2O) & Proteção Patrimonial
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Fechar explicação do método"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-obsidian-800 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Corpo com Tipografia Ampla e Alto Contraste */}
        <div className="space-y-4 px-6 py-6 text-base leading-relaxed text-slate-100 sm:px-8">
          <p>
            No modelo <strong className="text-white">AM2O*</strong> (<em>Always Move To Objective</em>),
            sempre direcionamos o novo aporte para as classes e ativos da sua carteira que estão{' '}
            <strong className="text-gold-300">mais distantes abaixo do seu objetivo percentual</strong>.
          </p>

          {/* 3 Pilares em Linhas Horizontais Amplas e Fáceis de Ler */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3.5 rounded-xl border border-slate-700/80 bg-obsidian-950 p-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-300">
                  1. Blindagem Hydra (Reserva de Emergência)
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-200">
                  Prioriza sua liquidez imediata (100% Reserva ou Híbrido 70%/30%) até que sua reserva
                  esteja 100% concluída.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-slate-700/80 bg-obsidian-950 p-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/15 text-gold-300">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gold-300">
                  2. Equilíbrio sem Vendas Desnecessárias
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-200">
                  Você equilibra a carteira comprando o que ficou descontado em relação à sua meta,
                  sem girar patrimônio e sem gerar imposto.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-slate-700/80 bg-obsidian-950 p-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-sky-300">
                  3. Filtro Fundamentalista DAVI
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-200">
                  Verifica indicadores de qualidade (ROE, distribuição de proventos e teto de P/VP)
                  alertando caso algum ativo precise de revisão.
                </p>
              </div>
            </div>
          </div>

          {/* Aviso Educativo com Máximo Contraste e Fonte Ampla */}
          <div className="rounded-xl border-2 border-amber-400/70 bg-[#191407] p-5 text-base leading-relaxed text-slate-50 shadow-lg">
            <p className="mb-1 text-base font-extrabold text-amber-300">
              ⚠️ Aviso Importante
            </p>
            <p>
              Isto <strong className="text-white">não é uma indicação ou recomendação de investimentos</strong>, e
              nenhuma das informações apresentadas deve ser encarada dessa forma — e sim como um{' '}
              <strong className="text-amber-200">método matemático de equilíbrio de carteira</strong> para apoiar a
              sua tomada de decisão individual.
            </p>
          </div>

          <p className="text-sm font-medium text-slate-300">
            * Ferramenta oficial da Metodologia Norte Invest (DAVI & Hydra).
          </p>
        </div>

        {/* Rodapé Amplo */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 bg-obsidian-950/80 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <input
              id="dont-show-am2o"
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => handleToggleDontShow(e.target.checked)}
              className="h-5 w-5 cursor-pointer rounded border-slate-600 bg-obsidian-950 accent-gold-500"
            />
            <label
              htmlFor="dont-show-am2o"
              className="cursor-pointer text-sm font-medium text-slate-200"
            >
              Não mostrar esta mensagem novamente ao abrir
            </label>
          </div>

          <Button type="button" variant="gold" size="lg" onClick={onClose}>
            OK, Entendi o Método
          </Button>
        </div>
      </Card>
    </div>
  );
}
