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
}

export function matchesDaviFilterMap(
  item: ComprehensiveRadarItem,
  filters: DaviFilterMap
): boolean {
  for (const [key, bound] of Object.entries(filters)) {
    if (!bound || (bound.min == null && bound.max == null)) continue;

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
      // Para valuation como P/L e P/VP, se o valor for negativo e o filtro estipulou limite (ou se for nulo), descarta
      if (val === null || val > bound.max) {
        return false;
      }
    }
  }

  return true;
}
