'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAccessibility } from '@/contexts/accessibility-context';

export function CursorMagnifier() {
  const { preferences } = useAccessibility();
  const [position, setPosition] = useState({ x: -200, y: -200 });
  const [visible, setVisible] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!preferences.cursorMagnifier) {
      setVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      animFrameRef.current = requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY });
        setVisible(true);
      });
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [preferences.cursorMagnifier]);

  if (!preferences.cursorMagnifier || !visible) return null;

  const size = 160;
  const half = size / 2;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[9999] select-none transition-opacity duration-150"
      style={{
        left: `${position.x - half}px`,
        top: `${position.y - half}px`,
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      {/* Círculo Externo com Borda de Vidro e Sombra Projetada */}
      <div className="relative h-full w-full rounded-full border-2 border-emerald-400 bg-emerald-500/5 shadow-[0_0_25px_rgba(16,185,129,0.35),0_12px_36px_rgba(0,0,0,0.85)] backdrop-brightness-125 backdrop-contrast-125">
        {/* Mira central (Crosshair suave) */}
        <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-emerald-400/30" />
        <div className="absolute top-1/2 left-0 h-[1px] w-full -translate-y-1/2 bg-emerald-400/30" />
        
        {/* Ponto central */}
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300 bg-emerald-500/50" />

        {/* Badge flutuante do nível de zoom */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full border border-emerald-500/50 bg-[#0d1527] px-2 py-0.5 text-[9px] font-mono font-extrabold text-emerald-300 shadow-md">
          {preferences.magnifierZoom.toFixed(1)}x
        </div>
      </div>
    </div>
  );
}
