import React from 'react';
import { ExternalLink } from 'lucide-react';
import { getAssetAnalysisUrl } from '@/lib/asset-links';

interface AssetTickerLinkProps {
  code: string;
  categoryOrType?: string | null;
  className?: string;
  showIcon?: boolean;
}

/**
 * Componente institucional para renderizar o Ticker como link direto para o Fundamentus
 * ou base de dados oficial com segurança contra tabnabbing (rel="noopener noreferrer").
 */
export function AssetTickerLink({
  code,
  categoryOrType,
  className = '',
  showIcon = true
}: AssetTickerLinkProps) {
  const info = getAssetAnalysisUrl(code, categoryOrType);

  return (
    <a
      href={info.url}
      target="_blank"
      rel="noopener noreferrer"
      title={info.tooltip}
      className={`group inline-flex items-center gap-1 font-extrabold text-white transition-all hover:text-emerald-400 hover:underline ${className}`}
    >
      <span>{code}</span>
      {showIcon && (
        <ExternalLink
          className="h-3 w-3 shrink-0 opacity-40 transition-all duration-150 group-hover:opacity-100 group-hover:text-emerald-400 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </a>
  );
}
