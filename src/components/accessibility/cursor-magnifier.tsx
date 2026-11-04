'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAccessibility } from '@/contexts/accessibility-context';

interface InspectedTarget {
  type: 'money' | 'ticker' | 'metric' | 'action' | 'text';
  label: string;
  value: string;
  sub?: string;
}

export function CursorMagnifier() {
  const { preferences } = useAccessibility();
  const [position, setPosition] = useState({ x: -300, y: -300 });
  const [visible, setVisible] = useState(false);
  const [inspected, setInspected] = useState<InspectedTarget | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const lastTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!preferences.cursorMagnifier) {
      setVisible(false);
      setInspected(null);
      if (lastTargetRef.current) {
        lastTargetRef.current.classList.remove('magnifier-highlight-target');
        lastTargetRef.current = null;
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      const clientX = e.clientX;
      const clientY = e.clientY;

      animFrameRef.current = requestAnimationFrame(() => {
        setPosition({ x: clientX, y: clientY });
        setVisible(true);

        // Inspeciona elemento sob o cursor
        // Temporariamente oculta ponteiros de auxílio se necessário (a lente já tem pointer-events-none)
        const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;

        if (!el || el.closest('[data-accessibility-drawer="true"]') || el.closest('#cursor-magnifier-lens')) {
          if (lastTargetRef.current) {
            lastTargetRef.current.classList.remove('magnifier-highlight-target');
            lastTargetRef.current = null;
          }
          setInspected(null);
          return;
        }

        // Realce sutil no elemento sob o foco
        if (lastTargetRef.current && lastTargetRef.current !== el) {
          lastTargetRef.current.classList.remove('magnifier-highlight-target');
        }
        el.classList.add('magnifier-highlight-target');
        lastTargetRef.current = el;

        // Extrai significado do conteúdo sob a mira
        const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('title');
        const text = (el.innerText || el.textContent || '').trim();

        const isButtonOrLink = el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button';
        const isMoney = text.includes('R$') || text.includes('USD') || /^\d+[.,]\d{2}%?$/.test(text);
        const isTicker = /^[A-Z]{4}(3|4|11|11B|5|6)$/.test(text) || /^[A-Z]{1,5}$/.test(text);

        if (isMoney) {
          setInspected({
            type: 'money',
            label: ariaLabel || 'Valor / Cotação',
            value: text.slice(0, 30)
          });
        } else if (isTicker) {
          setInspected({
            type: 'ticker',
            label: 'Ativo Identificado',
            value: text,
            sub: ariaLabel || undefined
          });
        } else if (isButtonOrLink) {
          setInspected({
            type: 'action',
            label: 'Comando Clicável',
            value: ariaLabel || text.slice(0, 24) || 'Ação Interativa'
          });
        } else if (text) {
          setInspected({
            type: 'text',
            label: ariaLabel || el.tagName.toLowerCase(),
            value: text.slice(0, 60)
          });
        } else {
          setInspected(null);
        }
      });
    };

    const handleMouseLeave = () => {
      setVisible(false);
      setInspected(null);
      if (lastTargetRef.current) {
        lastTargetRef.current.classList.remove('magnifier-highlight-target');
        lastTargetRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (lastTargetRef.current) {
        lastTargetRef.current.classList.remove('magnifier-highlight-target');
        lastTargetRef.current = null;
      }
    };
  }, [preferences.cursorMagnifier]);

  if (!preferences.cursorMagnifier || !visible) return null;

  const zoom = preferences.magnifierZoom || 2.0;
  const size = 200;
  const half = size / 2;

  // Escala dinâmica de fonte baseada no zoom da lupa
  const valueFontSize = zoom === 1.5 ? 'text-lg' : zoom === 2.0 ? 'text-xl' : 'text-2xl';

  return (
    <div
      id="cursor-magnifier-lens"
      aria-hidden="true"
      className="pointer-events-none fixed z-[9999] select-none transition-opacity duration-150"
      style={{
        left: `${position.x - half}px`,
        top: `${position.y - half}px`,
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      {/* Lente Óptica Circular de Alta Definição */}
      <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-full border-2 border-emerald-400 bg-obsidian-950/95 p-3 shadow-[0_0_30px_rgba(16,185,129,0.45),0_16px_40px_rgba(0,0,0,0.95)] backdrop-blur-md">
        {/* Retículo Óptico Suave (Crosshairs) */}
        <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-emerald-400/20" />
        <div className="absolute top-1/2 left-0 h-[1px] w-full -translate-y-1/2 bg-emerald-400/20" />

        {/* Anel de foco interno */}
        <div className="absolute inset-2 rounded-full border border-emerald-500/20 pointer-events-none" />

        {/* Topo: Categoria de Leitura */}
        <div className="relative z-10 mt-1 flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 border border-emerald-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-300">
            {inspected?.label || 'Lente Óptica'}
          </span>
        </div>

        {/* Centro: Conteúdo Focado com Ampliação Real */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-2 text-center">
          {inspected ? (
            <>
              <div
                className={`font-mono font-black tracking-tight text-white drop-shadow-md break-all leading-tight ${valueFontSize}`}
              >
                {inspected.value}
              </div>
              {inspected.sub && (
                <div className="mt-0.5 text-[9.5px] font-semibold text-slate-300 truncate max-w-[150px]">
                  {inspected.sub}
                </div>
              )}
            </>
          ) : (
            <div className="text-[10px] font-medium text-slate-400">
              Aponte para texto ou valor
            </div>
          )}
        </div>

        {/* Rodapé: Badge com Nível de Zoom */}
        <div className="relative z-10 mb-1 flex items-center gap-1 rounded-full border border-emerald-500/40 bg-obsidian-900 px-2.5 py-0.5 shadow-md">
          <span className="text-[10px] font-mono font-black text-emerald-300">
            {zoom.toFixed(1)}x
          </span>
          <span className="text-[8.5px] font-bold text-slate-400 uppercase">
            Zoom Ativo
          </span>
        </div>
      </div>
    </div>
  );
}
