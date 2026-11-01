import type { DaviFilterMap } from './davi-sidebar-filters';

export interface ComprehensiveRadarItem {
  code: string;
  name: string;
  type: string;
  category: 'acoes' | 'fiis' | 'stocks' | 'reits' | 'fixed';
  market: string;
  sector: string | null;
  price: number;
  peRatio: number | null;
  pbRatio: number | null;
  pVpa: number | null;
  dividendYield: number | null;
  roe: number | null;
  roic: number | null;
  roa: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  netDebtEbitda: number | null;
  ebitMargin: number | null;
  profitMargin: number | null;
  evEbit: number | null;
  evEbitda: number | null;
  psr: number | null;
  revenueGrowth: number | null;
  revenueGrowth5y: number | null;
  earningsGrowth: number | null;
  payoutRatio: number | null;
  marketCap: number | null;
  vacancyRate: number | null;
  capRate: number | null;
  ffoYield: number | null;
  liquidity: number | null;
  propertyCount: number | null;
  pricePerSqm: number | null;
  rentPerSqm: number | null;
  rateFixed: number | null;
  rateDescription: string | null;
  liquidityType: string | null;
  minInvestment: number | null;
  userRating: number | null;
  userNotes: string;
  // Campos auditados de governança e tipologia
  isNovoMercado?: boolean;
  isBestSector?: boolean;
  isMultiProperty?: boolean;
  isPaperFii?: boolean;
  isEtfGlobal?: boolean;
}

/**
 * Identifica se a ação atende aos critérios de Governança & Tag Along (Aulas 4.2 e 4.5).
 * Prioriza empresas no Novo Mercado, ações Ordinárias (ON - final 3) e companhias
 * históricas consolidadas com alinhamento de controle.
 */
export function isNovoMercadoAsset(assetOrCode: ComprehensiveRadarItem | string, category?: string): boolean {
  const code = typeof assetOrCode === 'string' ? assetOrCode : assetOrCode.code;
  const cat = typeof assetOrCode === 'string' ? (category || '') : assetOrCode.category;
  if (cat !== 'acoes') return false;
  const c = code.toUpperCase();

  // Ações Ordinárias terminadas em 3 possuem 100% de Tag Along no padrão B3
  if (/^[A-Z]{4}3$/.test(c)) return true;

  // Grandes holdings e companhias com governança Nível 2 / Units com Tag Along assegurado
  const accreditedGovernance = [
    'ITUB4', 'BBDC4', 'TAEE11', 'ALUP11', 'SAPR11', 'KLBN11', 'BPAC11', 'SANB11'
  ];
  return accreditedGovernance.includes(c);
}

/**
 * Identifica se a empresa pertence aos Setores Perenes do Método DAVI (Acrônimo BEST - Aula 4.4):
 * B = Bancos & Financeiro
 * E = Energia Elétrica / Utilidade Pública
 * S = Saneamento Básico & Água
 * T = Telecomunicações & Seguros
 */
export function isBestSectorAsset(assetOrCode: ComprehensiveRadarItem | string, sector?: string | null): boolean {
  const code = typeof assetOrCode === 'string' ? assetOrCode : assetOrCode.code;
  const sec = typeof assetOrCode === 'string' ? sector : assetOrCode.sector;
  const c = code.toUpperCase();
  const s = (sec || '').toLowerCase();

  // Códigos emblemáticos dos setores BEST
  const bestTickers = [
    'ITUB3', 'ITUB4', 'BBAS3', 'BBDC3', 'BBDC4', 'SANB11', 'BPAC11', 'B3SA3', 'ITSA3', 'ITSA4',
    'EGIE3', 'WEGE3', 'TAEE3', 'TAEE4', 'TAEE11', 'ALUP11', 'CPFE3', 'CPLE3', 'CPLE6', 'CMIG3', 'CMIG4', 'EQTL3', 'NEOE3', 'AURE3', 'ELET3', 'ELET6', 'ISAE4', 'TRPL4',
    'SAPR4', 'SAPR11', 'CSMG3', 'SBSP3',
    'BBSE3', 'CXSE3', 'PSSA3', 'VIVT3', 'TIMS3', 'WIZC3', 'IRBR3'
  ];
  if (bestTickers.includes(c)) return true;

  return (
    s.includes('banco') ||
    s.includes('financeiro') ||
    s.includes('energia') ||
    s.includes('eletricidade') ||
    s.includes('utilidade pública') ||
    s.includes('transmissão') ||
    s.includes('saneamento') ||
    s.includes('água') ||
    s.includes('seguro') ||
    s.includes('telecom')
  );
}

/**
 * Identifica se um FII é Multiativo e Multilocatário (Aulas 5.3 e 5.5).
 * Elimina fundos monoativos (< 5 imóveis) causadores de risco de vacância aguda.
 */
export function isMultiPropertyFii(assetOrCode: ComprehensiveRadarItem | string, propertyCount?: number | null): boolean {
  const code = typeof assetOrCode === 'string' ? assetOrCode : assetOrCode.code;
  const count = typeof assetOrCode === 'string' ? propertyCount : assetOrCode.propertyCount;
  if (count !== null && count !== undefined && count >= 5) return true;

  const multiFiiTickers = [
    'HGLG11', 'BTLG11', 'XPLG11', 'VILG11', 'BRCO11', 'GGRC11', 'GARE11', 'LVBI11',
    'XPML11', 'VISC11', 'HGBS11', 'HSML11',
    'KNRI11', 'HGRU11', 'TRXF11', 'ALZR11', 'HGRE11', 'JSRE11', 'PVBI11', 'RBRP11'
  ];
  return multiFiiTickers.includes(code.toUpperCase());
}

/**
 * Identifica se um FII é do tipo Papel / Recebíveis Imobiliários (CRI/LCI) (Aula 5.2).
 */
export function isPaperFii(assetOrCode: ComprehensiveRadarItem | string, sector?: string | null): boolean {
  const code = typeof assetOrCode === 'string' ? assetOrCode : assetOrCode.code;
  const sec = typeof assetOrCode === 'string' ? sector : assetOrCode.sector;
  const cat = typeof assetOrCode === 'string' ? 'fiis' : assetOrCode.category;
  if (cat !== 'fiis') return false;
  const c = code.toUpperCase();
  const s = (sec || '').toLowerCase();

  const paperTickers = [
    'KNIP11', 'KNCR11', 'KNSC11', 'KNHY11', 'CPTS11', 'VRTA11', 'RBRR11', 'HGCR11',
    'CVBI11', 'MCCI11', 'VGIR11', 'VGIP11', 'IRDM11', 'RECR11', 'BCRI11', 'XPCI11', 'DEVA11', 'HCTR11'
  ];
  if (paperTickers.includes(c)) return true;

  return (
    s.includes('papel') ||
    s.includes('recebíveis') ||
    s.includes('cri') ||
    s.includes('cdi') ||
    s.includes('ipca+')
  );
}

/**
 * Identifica se o ativo é um ETF Global de Baixo Custo negociado nos EUA ou B3 (Aula 6.2).
 */
export function isEtfGlobalAsset(assetOrCode: ComprehensiveRadarItem | string): boolean {
  const code = typeof assetOrCode === 'string' ? assetOrCode : assetOrCode.code;
  const globalEtfs = [
    'VOO', 'VT', 'VNQ', 'IVV', 'SPY', 'QQQ', 'SCHD', 'IVVB11', 'ACWI', 'VTI', 'VEA', 'VWO'
  ];
  return globalEtfs.includes(code.toUpperCase());
}

function isFilterActive(val: unknown): boolean {
  if (val === true) return true;
  if (val && typeof val === 'object') {
    const obj = val as { min?: number | null; max?: number | null };
    return obj.min === 1 || obj.max === 1;
  }
  return false;
}

export function matchesDaviFilterMap(
  item: ComprehensiveRadarItem,
  filters: DaviFilterMap
): boolean {
  // 1. Filtros Especiais da Metodologia DAVI & Hydra
  if (isFilterActive(filters.only_novo_mercado)) {
    if (!isNovoMercadoAsset(item)) return false;
  }

  if (isFilterActive(filters.only_best_sectors)) {
    if (!isBestSectorAsset(item)) return false;
  }

  if (isFilterActive(filters.only_multi_property)) {
    if (!isMultiPropertyFii(item)) return false;
  }

  if (isFilterActive(filters.only_etfs)) {
    if (!isEtfGlobalAsset(item)) return false;
  }

  // 2. Régua Inteligente de P/VP para FIIs (Aula 5.2):
  // Para FIIs de Papel, o P/VP NUNCA deve ultrapassar 1.02.
  if (isFilterActive(filters.smart_fii_pvp)) {
    if (item.category === 'fiis') {
      const pvp = item.pVpa ?? item.pbRatio;
      if (pvp !== null) {
        if (isPaperFii(item)) {
          if (pvp > 1.02) return false;
        } else {
          // Tijolo: aceita até 1.08
          if (pvp > 1.08) return false;
        }
      }
    }
  }

  // 3. Filtros Numéricos Tradicionais
  for (const [key, bound] of Object.entries(filters)) {
    if (!bound || typeof bound !== 'object' || (bound.min == null && bound.max == null)) continue;
    if (['only_novo_mercado', 'only_best_sectors', 'only_multi_property', 'only_etfs', 'smart_fii_pvp'].includes(key)) {
      continue;
    }

    let val: number | null = null;

    switch (key) {
      case 'pe_ratio':
        val = item.peRatio;
        break;
      case 'pb_ratio':
        val = item.pbRatio ?? item.pVpa;
        break;
      case 'p_vpa':
        val = item.pVpa ?? item.pbRatio;
        break;
      case 'ev_ebit':
        val = item.evEbit;
        break;
      case 'ev_ebitda':
        val = item.evEbitda;
        break;
      case 'psr':
        val = item.psr;
        break;
      case 'dividend_yield':
        val = item.dividendYield;
        break;
      case 'roe':
        val = item.roe;
        break;
      case 'roic':
        val = item.roic;
        break;
      case 'roa':
        val = item.roa;
        break;
      case 'ebit_margin':
        val = item.ebitMargin;
        break;
      case 'profit_margin':
        val = item.profitMargin;
        break;
      case 'current_ratio':
        val = item.currentRatio;
        break;
      case 'debt_to_equity':
        val = item.debtToEquity;
        break;
      case 'net_debt_ebitda':
        val = item.netDebtEbitda;
        break;
      case 'revenue_growth':
        val = item.revenueGrowth;
        break;
      case 'revenue_growth_5y':
        val = item.revenueGrowth5y;
        break;
      case 'earnings_growth':
        val = item.earningsGrowth;
        break;
      case 'payout_ratio':
        val = item.payoutRatio;
        break;
      case 'market_cap':
        val = item.marketCap;
        break;
      case 'vacancy_rate':
        val = item.vacancyRate;
        break;
      case 'cap_rate':
        val = item.capRate;
        break;
      case 'ffo_yield':
        val = item.ffoYield;
        break;
      case 'liquidity':
        val = item.liquidity;
        break;
      case 'property_count':
        val = item.propertyCount;
        break;
      case 'price_per_sqm':
        val = item.pricePerSqm;
        break;
      case 'rent_per_sqm':
        val = item.rentPerSqm;
        break;
      case 'rate_fixed':
        val = item.rateFixed;
        break;
      case 'min_investment':
        val = item.minInvestment;
        break;
      case 'user_rating':
        val = item.userRating;
        break;
      default:
        break;
    }

    // Se o filtro exige mínimo e o valor é nulo ou menor que o mínimo:
    if (bound.min != null) {
      if (val === null || val < bound.min) {
        return false;
      }
    }

    // Se o filtro exige máximo e o valor é nulo ou maior que o máximo:
    if (bound.max != null) {
      if (val === null || val > bound.max) {
        return false;
      }
    }
  }

  return true;
}
