'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAccessibility } from '@/contexts/accessibility-context';

export function CursorMagnifier() {
  const { preferences } = useAccessibility();
  const [position, setPosition] = useState({ x: -300, y: -300 });
  const [visible, setVisible] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const currentTargetRef = useRef<{
    el: HTMLElement;
    prevTransform: string;
    prevTransformOrigin: string;
    prevZIndex: string;
    prevPosition: string;
    prevTransition: string;
  } | null>(null);

  // Limpa transformações do elemento ampliado
  const restoreTarget = () => {
    if (currentTargetRef.current) {
      const { el, prevTransform, prevTransformOrigin, prevZIndex, prevPosition, prevTransition } =
        currentTargetRef.current;
      el.style.transform = prevTransform;
      el.style.transformOrigin = prevTransformOrigin;
      el.style.zIndex = prevZIndex;
      el.style.position = prevPosition;
      el.style.transition = prevTransition;
      el.classList.remove('magnifier-highlight-target');
      currentTargetRef.current = null;
    }
  };

  useEffect(() => {
    if (!preferences.cursorMagnifier) {
      setVisible(false);
      restoreTarget();
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

        const zoom = preferences.magnifierZoom || 1.5;

        // Identifica o elemento sob a mira da lente
        const rawEl = document.elementFromPoint(clientX, clientY) as HTMLElement | null;

        if (!rawEl || rawEl.closest('[data-accessibility-drawer="true"]') || rawEl.closest('#cursor-magnifier-lens')) {
          restoreTarget();
          return;
        }

        const tag = rawEl.tagName.toLowerCase();
        if (tag === 'html' || tag === 'body' || tag === 'main' || tag === 'section' || tag === 'aside') {
          restoreTarget();
          return;
        }

        // Localiza o nó mais relevante com texto, botão, link ou valor
        const target = (rawEl.closest(
          'button, a, td, th, [role="button"], h1, h2, h3, h4, h5, h6, p, label, span, strong, input'
        ) || rawEl) as HTMLElement;

        // Evita aplicar em blocos gigantes de layout
        if (!target || (target.offsetWidth > 700 && target.offsetHeight > 350)) {
          restoreTarget();
          return;
        }

        // Se o elemento mudou, restaura o anterior e amplia o novo
        if (currentTargetRef.current?.el !== target) {
          restoreTarget();

          currentTargetRef.current = {
            el: target,
            prevTransform: target.style.transform || '',
            prevTransformOrigin: target.style.transformOrigin || '',
            prevZIndex: target.style.zIndex || '',
            prevPosition: target.style.position || '',
            prevTransition: target.style.transition || ''
          };

          target.style.position = target.style.position && target.style.position !== 'static' ? target.style.position : 'relative';
          target.style.zIndex = '45';
          target.style.transformOrigin = 'center center';
          target.style.transition = 'transform 0.12s cubic-bezier(0.2, 0, 0, 1)';
          target.style.transform = `scale(${zoom})`;
          target.classList.add('magnifier-highlight-target');
        }
      });
    };

    const handleMouseLeave = () => {
      setVisible(false);
      restoreTarget();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      restoreTarget();
    };
  }, [preferences.cursorMagnifier, preferences.magnifierZoom]);

  if (!preferences.cursorMagnifier || !visible) return null;

  const zoom = preferences.magnifierZoom || 1.5;
  const size = 180;
  const half = size / 2;

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
      {/* Lente Óptica de Vidro 100% Transparente (Visão desobstruída através do vidro) */}
      <div className="relative h-full w-full rounded-full border-2 border-emerald-400 bg-emerald-500/[0.03] shadow-[0_0_20px_rgba(16,185,129,0.35),inset_0_0_15px_rgba(16,185,129,0.1),0_12px_32px_rgba(0,0,0,0.55)]">
        {/* Aro metálico interno de refração óptica */}
        <div className="absolute inset-1 rounded-full border border-emerald-300/30 pointer-events-none" />

        {/* Retículo Óptico Suave (Mira de precisão sem obstruir o centro) */}
        <div className="absolute left-1/2 top-0 h-3.5 w-[1.5px] -translate-x-1/2 bg-emerald-400/60" />
        <div className="absolute left-1/2 bottom-0 h-3.5 w-[1.5px] -translate-x-1/2 bg-emerald-400/60" />
        <div className="absolute top-1/2 left-0 h-[1.5px] w-3.5 -translate-y-1/2 bg-emerald-400/60" />
        <div className="absolute top-1/2 right-0 h-[1.5px] w-3.5 -translate-y-1/2 bg-emerald-400/60" />

        {/* Ponto central sutil */}
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/50 bg-emerald-400/20" />

        {/* Badge do Nível de Zoom no Aro Inferior (fora do campo central de visão) */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-emerald-500/50 bg-[#070A11] px-2.5 py-0.5 shadow-md">
          <span className="text-[10px] font-mono font-black text-emerald-300">
            {zoom.toFixed(1)}x
          </span>
          <span className="text-[8.5px] font-bold text-slate-400 uppercase">
            Lente
          </span>
        </div>
      </div>
    </div>
  );
}
