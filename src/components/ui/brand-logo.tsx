import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  centered?: boolean;
  className?: string;
}

export function BrandLogo({ size = 'md', centered = false, className }: BrandLogoProps) {
  const iconSizes = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-9 w-9 rounded-[9px]',
    lg: 'h-12 w-12 rounded-xl'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-[18px]',
    lg: 'text-2xl'
  };

  const subtitleSizes = {
    sm: 'text-[9.5px]',
    md: 'text-[10px]',
    lg: 'text-[11px]'
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 select-none',
        centered && 'justify-center',
        className
      )}
    >
      {/* Arte Oficial MANTFRAI */}
      <img
        src="/icon.svg"
        alt="MANTFRAI — Método Antifrágil de Investimento"
        className={cn('shrink-0 shadow-md', iconSizes[size])}
      />
      <div className="text-left leading-tight">
        <span
          className={cn(
            'block font-extrabold tracking-tight text-white',
            titleSizes[size]
          )}
        >
          MANTFRAI
        </span>
        <span
          className={cn(
            'block font-medium uppercase tracking-[0.06em] text-slate-400',
            subtitleSizes[size]
          )}
        >
          MÉTODO ANTIFRÁGIL DE INVESTIMENTO
        </span>
      </div>
    </div>
  );
}
