'use client';

import React from 'react';
import {
  X,
  RotateCcw,
  Volume2,
  Eye,
  Type,
  Palette,
  Search,
  Check,
  Sparkles,
  ZapOff,
  ZoomIn
} from 'lucide-react';
import {
  useAccessibility,
  ColorTheme,
  FontScale
} from '@/contexts/accessibility-context';
import { speakText, stopSpeech } from '@/lib/accessibility/speech-engine';

const COLOR_THEMES: {
  id: ColorTheme;
  name: string;
  desc: string;
  badge: string;
  colors: string[];
}[] = [
  {
    id: 'obsidian',
    name: 'Dark Obsidian',
    desc: 'Visual padrão elegante e sóbrio com toques em verde esmeralda e dourado.',
    badge: 'Padrão',
    colors: ['#070A11', '#0D1527', '#10B981', '#FBBF24']
  },
  {
    id: 'high_contrast',
    name: 'Alto Contraste (AAA)',
    desc: 'Preto puro com amarelo neon e branco. Máximo contraste e legibilidade.',
    badge: 'WCAG AAA',
    colors: ['#000000', '#FDE047', '#FFFFFF', '#4ADE80']
  },
  {
    id: 'deuteranopia',
    name: 'Deuteranopia',
    desc: 'Otimizado para daltonismo verde-vermelho com azul cobalto e laranja âmbar.',
    badge: 'Daltônico',
    colors: ['#070B14', '#0F172A', '#38BDF8', '#F97316']
  },
  {
    id: 'protanopia',
    name: 'Protanopia',
    desc: 'Substitui tons avermelhados por azul elétrico brilhante e amarelo solar.',
    badge: 'Daltônico',
    colors: ['#070B14', '#0F172A', '#60A5FA', '#EAB308']
  },
  {
    id: 'tritanopia',
    name: 'Tritanopia',
    desc: 'Para ausência de cones azuis: substitui por ciano água e magenta vibrante.',
    badge: 'Daltônico',
    colors: ['#090B12', '#141B2D', '#2DD4BF', '#EC4899']
  },
  {
    id: 'light_titanium',
    name: 'Titânio Suave',
    desc: 'Modo claro elegante com tons de pérola e cinza suave sem brilho ofuscante.',
    badge: 'Modo Claro',
    colors: ['#F1F5F9', '#FFFFFF', '#059669', '#334155']
  }
];

const FONT_SCALES: { id: FontScale; label: string; scale: string }[] = [
  { id: 'standard', label: 'Padrão', scale: '100%' },
  { id: 'medium', label: 'Médio', scale: '115%' },
  { id: 'large', label: 'Grande', scale: '130%' },
  { id: 'extra_large', label: 'Máximo', scale: '145%' }
];

const PAGE_ZOOMS = [
  { value: 1.0, label: '100%', desc: 'Normal' },
  { value: 1.15, label: '115%', desc: 'Médio' },
  { value: 1.25, label: '125%', desc: 'Grande' },
  { value: 1.5, label: '150%', desc: 'Máximo' }
];

export function AccessibilityDrawer() {
  const {
    preferences,
    isDrawerOpen,
    closeDrawer,
    setColorTheme,
    setFontScale,
    toggleDyslexicFont,
    toggleCursorMagnifier,
    setMagnifierZoom,
    setPageZoom,
    toggleHighlightTargets,
    toggleClickToSpeech,
    setSpeechRate,
    toggleReduceMotion,
    resetToDefaults
  } = useAccessibility();

  if (!isDrawerOpen) return null;

  const handleTestSpeech = () => {
    speakText(
      'MANTFRAI. Método Antifrágil de Investimento. Patrimônio total vinte e nove mil duzentos e sete reais e cinquenta e seis centavos. Rentabilidade mais dezesseis vírgula noventa e quatro por cento.',
      { rate: preferences.speechRate }
    );
  };

  const currentPageZoom = preferences.pageZoom || 1.0;

  return (
    <div
      data-accessibility-drawer="true"
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de Configurações e Acessibilidade"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-[#0d1527] text-white shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Topo do Drawer */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configurações & Acessibilidade</h2>
              <p className="text-[11px] text-slate-400">Personalize o tema, zoom e leitura da interface</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Fechar configurações"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5 scrollbar-thin">
          {/* 1. Paleta de Cores e Daltonismo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Palette className="h-4 w-4 text-emerald-400" />
                Tema & Paleta de Cores
              </label>
              <span className="text-[11px] font-semibold text-emerald-400">
                {COLOR_THEMES.find((t) => t.id === preferences.colorTheme)?.badge}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {COLOR_THEMES.map((t) => {
                const isSelected = preferences.colorTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setColorTheme(t.id)}
                    className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/50'
                        : 'border-slate-800 bg-[#111c34]/70 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{t.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {t.desc}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1">
                      {t.colors.map((c, i) => (
                        <span
                          key={i}
                          className="h-3 w-3 rounded-full border border-black/30 shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Zoom Geral da Interface (Tela Inteira) */}
          <div className="space-y-3 border-t border-slate-800/80 pt-5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <ZoomIn className="h-4 w-4 text-amber-400" />
                Zoom da Interface (Tela Inteira)
              </label>
              <span className="text-xs font-bold text-amber-400">
                {(currentPageZoom * 100).toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PAGE_ZOOMS.map((z) => {
                const isSelected = Math.abs(currentPageZoom - z.value) < 0.01;
                return (
                  <button
                    key={z.value}
                    type="button"
                    onClick={() => setPageZoom(z.value)}
                    className={`flex flex-col items-center justify-center rounded-xl border py-2 text-center transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20 text-white ring-1 ring-amber-500/50'
                        : 'border-slate-800 bg-[#111c34] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-extrabold">{z.label}</span>
                    <span className="text-[9.5px] font-medium text-slate-400">{z.desc}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Amplia todos os elementos, cards e tabelas da aplicação simultaneamente.
            </p>
          </div>

          {/* 3. Escala Tipográfica (Tamanho da Fonte) */}
          <div className="space-y-3 border-t border-slate-800/80 pt-5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Type className="h-4 w-4 text-sky-400" />
                Tamanho do Texto
              </label>
              <span className="text-xs font-bold text-sky-400">
                {FONT_SCALES.find((f) => f.id === preferences.fontScale)?.scale}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {FONT_SCALES.map((f) => {
                const isSelected = preferences.fontScale === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontScale(f.id)}
                    className={`rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/20 text-white ring-1 ring-sky-500/50'
                        : 'border-slate-800 bg-[#111c34] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Pré-visualização ao vivo */}
            <div className="rounded-xl border border-slate-800 bg-[#111c34]/50 p-3">
              <span className="text-[11px] text-slate-400 block mb-0.5">Exemplo em Tempo Real:</span>
              <div className="font-extrabold text-white">Patrimônio: R$ 29.207,56</div>
              <div className="text-[11px] font-semibold text-emerald-400">+16,94% de retorno sobre custo</div>
            </div>
          </div>

          {/* 4. Auxílios Visuais & Lupa Óptica no Mouse */}
          <div className="space-y-3 border-t border-slate-800/80 pt-5">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Eye className="h-4 w-4 text-purple-400" />
              Auxílios Visuais & Lupa no Cursor
            </label>

            {/* Toggle Lupa */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#111c34] p-3">
              <div>
                <span className="text-xs font-bold text-white block">Lupa no Mouse</span>
                <span className="text-[11px] text-slate-400">Lente flutuante que segue o cursor e amplia valores</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.cursorMagnifier}
                onClick={toggleCursorMagnifier}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  preferences.cursorMagnifier ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.cursorMagnifier ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {preferences.cursorMagnifier && (
              <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Nível de Zoom da Lupa:</span>
                  <div className="flex items-center gap-1.5">
                    {[1.5, 2.0, 2.5].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setMagnifierZoom(z)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono transition-colors ${
                          preferences.magnifierZoom === z
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {z.toFixed(1)}x
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10.5px] text-slate-400 leading-snug">
                  A lente óptica amplia os números, códigos B3 e textos diretamente sob a mira do cursor.
                </p>
              </div>
            )}

            {/* Toggle Realce de Elementos Clicáveis */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#111c34] p-3">
              <div>
                <span className="text-xs font-bold text-white block">Realçar Clicáveis</span>
                <span className="text-[11px] text-slate-400">Bordas acentuadas em todos os botões e links</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.highlightClickTargets}
                onClick={toggleHighlightTargets}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  preferences.highlightClickTargets ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.highlightClickTargets ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Dislexia */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#111c34] p-3">
              <div>
                <span className="text-xs font-bold text-white block">Espaçamento para Dislexia</span>
                <span className="text-[11px] text-slate-400">Amplia o espaço entre letras e palavras</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.fontDyslexic}
                onClick={toggleDyslexicFont}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  preferences.fontDyslexic ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.fontDyslexic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 5. Leitura em Voz Alta (Text-to-Speech) */}
          <div className="space-y-3 border-t border-slate-800/80 pt-5">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Volume2 className="h-4 w-4 text-emerald-400" />
              Narração & Leitura por Voz (TTS)
            </label>

            {/* Toggle Leitura ao Clicar */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#111c34] p-3">
              <div>
                <span className="text-xs font-bold text-white block">Ler ao Clicar</span>
                <span className="text-[11px] text-slate-400">Vocaliza em voz alta o botão, valor ou texto clicado</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.clickToSpeech}
                onClick={toggleClickToSpeech}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  preferences.clickToSpeech ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.clickToSpeech ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Velocidade da Voz */}
            <div className="space-y-2 rounded-xl border border-slate-800 bg-[#111c34] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Velocidade da Fala:</span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {preferences.speechRate.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.1"
                value={preferences.speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
                aria-label="Velocidade da narração"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleTestSpeech}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  🔊 Testar Voz Agora
                </button>
              </div>
            </div>
          </div>

          {/* 6. Redução de Movimento */}
          <div className="space-y-3 border-t border-slate-800/80 pt-5">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#111c34] p-3">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <ZapOff className="h-3.5 w-3.5 text-amber-400" />
                  Reduzir Animações
                </span>
                <span className="text-[11px] text-slate-400">Desativa transições para evitar vertigem</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.reduceMotion}
                onClick={toggleReduceMotion}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  preferences.reduceMotion ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.reduceMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#090d18] p-4">
          <button
            type="button"
            onClick={resetToDefaults}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Padrões</span>
          </button>

          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
