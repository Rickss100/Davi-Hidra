export interface AssetLinkInfo {
  url: string;
  provider: 'Fundamentus' | 'Fundamentus FIIs' | 'Status Invest' | 'Tesouro Direto';
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
 * Constrói a URL do provedor fundamentalista oficial (Fundamentus para B3, Status Invest para EUA, Tesouro para Renda Fixa).
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

  // 2. REITs (Real Estate Investment Trusts - EUA)
  if (cat === 'reit' || cat === 'reits') {
    return {
      url: `https://statusinvest.com.br/reits/eua/${cleanCode.toLowerCase()}`,
      provider: 'Status Invest',
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
      provider: 'Status Invest',
      tooltip: `Consultar fundamentos de ${cleanCode} no Status Invest (Mercado Americano)`
    };
  }

  // 4. Fundos Imobiliários (FIIs - B3)
  const isFiiCategory = cat === 'fii' || cat === 'fiis';
  const endsWith11 = cleanCode.endsWith('11') || cleanCode.endsWith('11B');
  const isB3Unit = B3_KNOWN_UNITS.has(cleanCode);

  if ((isFiiCategory || endsWith11) && !isB3Unit) {
    return {
      url: `https://www.fundamentus.com.br/fii_detalhes.php?papel=${cleanCode}`,
      provider: 'Fundamentus FIIs',
      tooltip: `Consultar dados, vacância e proventos de ${cleanCode} no Fundamentus FIIs`
    };
  }

  // 5. Ações Brasil (B3) — Padrão Ouro Fundamentus
  return {
    url: `https://www.fundamentus.com.br/detalhes.php?papel=${cleanCode}`,
    provider: 'Fundamentus',
    tooltip: `Consultar balanço e indicadores fundamentalistas de ${cleanCode} no Fundamentus`
  };
}
