'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAccessibility } from '@/contexts/accessibility-context';

export function CursorMagnifier() {
  const { preferences } = useAccessibility();
  const pathname = usePathname();

  const [position, setPosition] = useState({ x: -400, y: -400 });
  const [visible, setVisible] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const lastMouseRef = useRef({ x: -400, y: -400 });

  const zoom = preferences.magnifierZoom || 1.5;
  const size = 220;
  const half = size / 2;

  // Clona o conteúdo da página para dentro do visor óptico circular da lente
  const syncClone = useCallback(() => {
    if (!preferences.cursorMagnifier || !viewportRef.current) return;

    const source =
      document.getElementById('magnifiable-page-content') ||
      document.querySelector('main') ||
      document.body;

    if (!source) return;

    viewportRef.current.innerHTML = '';

    const clone = source.cloneNode(true) as HTMLElement;

    // Remove referências a menus de acessibilidade ou à própria lente se presentes
    clone
      .querySelectorAll('#cursor-magnifier-lens, [data-accessibility-drawer="true"]')
      .forEach((el) => el.remove());

    // Remove todos os atributos ID do clone para evitar IDs duplicados no DOM
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));

    // Configuração do clone para projeção ótica pura e imune a cliques
    clone.style.pointerEvents = 'none';
    clone.style.userSelect = 'none';
    clone.style.position = 'absolute';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.margin = '0';
    clone.style.transformOrigin = '0 0';
    clone.style.width = `${source.offsetWidth || document.documentElement.scrollWidth}px`;
    clone.style.minHeight = `${source.offsetHeight || document.documentElement.scrollHeight}px`;

    viewportRef.current.appendChild(clone);
  }, [preferences.cursorMagnifier]);

  // Atualiza a posição da projeção ampliada na GPU a 60/120fps
  const updateProjection = useCallback(
    (clientX: number, clientY: number) => {
      lastMouseRef.current = { x: clientX, y: clientY };
      setPosition({ x: clientX, y: clientY });
      setVisible(true);

      if (viewportRef.current) {
        const docX = clientX + window.scrollX;
        const docY = clientY + window.scrollY;
        const tx = half - docX * zoom;
        const ty = half - docY * zoom;
        viewportRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${zoom})`;
      }
    },
    [half, zoom]
  );

  // Sincroniza o clone quando a lupa é ativada ou a rota muda
  useEffect(() => {
    if (!preferences.cursorMagnifier) {
      setVisible(false);
      if (viewportRef.current) {
        viewportRef.current.innerHTML = '';
      }
      return;
    }

    const timer = setTimeout(() => {
      syncClone();
    }, 100);

    return () => clearTimeout(timer);
  }, [preferences.cursorMagnifier, pathname, syncClone]);

  // Escuta movimentos do mouse e scroll
  useEffect(() => {
    if (!preferences.cursorMagnifier) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      const cx = e.clientX;
      const cy = e.clientY;

      animFrameRef.current = requestAnimationFrame(() => {
        updateProjection(cx, cy);
      });
    };

    const handleScroll = () => {
      if (lastMouseRef.current.x >= 0 && lastMouseRef.current.y >= 0) {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
        animFrameRef.current = requestAnimationFrame(() => {
          updateProjection(lastMouseRef.current.x, lastMouseRef.current.y);
        });
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [preferences.cursorMagnifier, updateProjection]);

  if (!preferences.cursorMagnifier || !visible) return null;

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
      {/* Visor Óptico Circular: Delimita e amplia APENAS o conteúdo que está DENTRO da lente */}
      <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-emerald-400 bg-obsidian-950 shadow-[0_0_30px_rgba(16,185,129,0.45),0_16px_40px_rgba(0,0,0,0.9)]">
        {/* Container que recebe a projeção óptica ampliada */}
        <div
          ref={viewportRef}
          className="absolute left-0 top-0 pointer-events-none select-none origin-top-left"
        />

        {/* Aro metálico interno de refração óptica */}
        <div className="absolute inset-0 rounded-full border border-emerald-300/30 pointer-events-none" />

        {/* Retículo Óptico Suave (Mira de alta precisão nas extremidades) */}
        <div className="absolute left-1/2 top-0 h-3.5 w-[1.5px] -translate-x-1/2 bg-emerald-400/70" />
        <div className="absolute left-1/2 bottom-0 h-3.5 w-[1.5px] -translate-x-1/2 bg-emerald-400/70" />
        <div className="absolute top-1/2 left-0 h-[1.5px] w-3.5 -translate-y-1/2 bg-emerald-400/70" />
        <div className="absolute top-1/2 right-0 h-[1.5px] w-3.5 -translate-y-1/2 bg-emerald-400/70" />

        {/* Ponto central sutil */}
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/60 bg-emerald-400/25" />
      </div>

      {/* Badge Externo do Nível de Zoom (Aro Inferior fora do campo visual da lente) */}
      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-emerald-500/50 bg-[#070A11] px-2.5 py-0.5 shadow-md">
        <span className="text-[10px] font-mono font-black text-emerald-300">
          {zoom.toFixed(1)}x
        </span>
        <span className="text-[8.5px] font-bold text-slate-400 uppercase">
          Lente
        </span>
      </div>
    </div>
  );
}
