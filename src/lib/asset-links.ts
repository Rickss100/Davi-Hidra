export interface AssetLinkInfo {
  url: string;
  provider:
    | 'Fundamentus'
    | 'Status Invest (FIIs)'
    | 'Status Invest (REITs)'
    | 'Status Invest (EUA)'
    | 'Tesouro Direto';
  tooltip: string;
}

const B3_KNOWN_UNITS = new Set([
  'TAEE11',
  'SAPR11',
  'ALUP11',
  'BPAC11',
  'KLBN11',
  'SANB11',
  'ENGI11',
  'CPLE11',
  'RANI11',
  'SULA11',
  'TIET11'
]);

/**
 * Constrói a URL do provedor fundamentalista oficial:
 * - Ações B3: Fundamentus (detalhes.php?papel=...)
 * - FIIs B3: Status Invest (fundos-imobiliarios/...) — o script fii_detalhes.php do Fundamentus possui erro interno de MySQL
 * - REITs EUA: Status Invest (reits/...) — rota sem /eua/
 * - Stocks EUA: Status Invest (acoes/eua/...)
 * - Renda Fixa: Tesouro Direto
 */
export function getAssetAnalysisUrl(
  code: string,
  categoryOrType?: string | null
): AssetLinkInfo {
  const cleanCode = (code || '').trim().toUpperCase();
  const cat = (categoryOrType || '').toLowerCase();

  // 1. Renda Fixa Soberana / Tesouro Direto
  if (
    cleanCode.startsWith('TESOURO_') ||
    cleanCode.includes('LFT') ||
    cleanCode.includes('NTNB') ||
    cat === 'fixed' ||
    cat === 'renda fixa' ||
    cat === 'renda_fixa'
  ) {
    return {
      url: 'https://www.tesourodireto.com.br/titulos/precos-e-taxas.htm',
      provider: 'Tesouro Direto',
      tooltip: `Consultar rentabilidade de ${cleanCode} no portal oficial do Tesouro Direto`
    };
  }

  // 2. REITs (Real Estate Investment Trusts - EUA) -> Rota oficial Status Invest sem /eua/
  if (cat === 'reit' || cat === 'reits') {
    return {
      url: `https://statusinvest.com.br/reits/${cleanCode.toLowerCase()}`,
      provider: 'Status Invest (REITs)',
      tooltip: `Consultar dados e indicadores do REIT ${cleanCode} no Status Invest`
    };
  }

  // 3. Stocks (Ações Internacionais - EUA)
  if (
    cat === 'stock' ||
    cat === 'stocks' ||
    (!cleanCode.includes('_') && !/\d/.test(cleanCode) && cleanCode.length >= 1 && cleanCode.length <= 5)
  ) {
    return {
      url: `https://statusinvest.com.br/acoes/eua/${cleanCode.toLowerCase()}`,
      provider: 'Status Invest (EUA)',
      tooltip: `Consultar fundamentos de ${cleanCode} no Status Invest (Mercado Americano)`
    };
  }

  // 4. Fundos Imobiliários (FIIs - B3)
  // Usamos Status Invest pois o fii_detalhes.php do Fundamentus possui bug interno de mysqli_query()
  const isFiiCategory = cat === 'fii' || cat === 'fiis';
  const endsWith11 = cleanCode.endsWith('11') || cleanCode.endsWith('11B');
  const isB3Unit = B3_KNOWN_UNITS.has(cleanCode);

  if ((isFiiCategory || endsWith11) && !isB3Unit) {
    return {
      url: `https://statusinvest.com.br/fundos-imobiliarios/${cleanCode.toLowerCase()}`,
      provider: 'Status Invest (FIIs)',
      tooltip: `Consultar vacância, portfólio e dividendos de ${cleanCode} no Status Invest`
    };
  }

  // 5. Ações Brasil (B3) — Padrão Ouro Fundamentus estável
  return {
    url: `https://www.fundamentus.com.br/detalhes.php?papel=${cleanCode}`,
    provider: 'Fundamentus',
    tooltip: `Consultar balanço e indicadores fundamentalistas de ${cleanCode} no Fundamentus`
  };
}
