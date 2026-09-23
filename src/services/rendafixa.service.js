/**
 * Serviço de Renda Fixa - DAVI & HYDRA
 * Gerencia ativos de Renda Fixa (Tesouro Direto, CDBs, LCIs, LCAs, Debêntures)
 * com taxas atualizadas e integração com indicadores do BACEN.
 */

import { getEconomicSnapshot } from './bacen.service.js';
import { upsertAsset, upsertPrice, insertFundamentals } from './database.service.js';

// Catálogo base de ativos de Renda Fixa de referência no mercado brasileiro
export const RENDA_FIXA_CATALOG = [
  // --- TÍTULOS PÚBLICOS (TESOURO DIRETO) ---
  {
    code: 'TESOURO_SELIC_2027',
    name: 'Tesouro Selic 2027 (LFT)',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'Título Público Federal',
    indexer: 'SELIC',
    rate_fixed: 0.05,
    rate_description: 'Selic + 0,05% a.a.',
    maturity_date: '2027-03-01',
    liquidity_type: 'D+0 (Diária)',
    guarantee: 'Tesouro Nacional (Soberano)',
    tax_free: 0,
    min_investment: 145.50,
    default_price: 14550.00
  },
  {
    code: 'TESOURO_SELIC_2029',
    name: 'Tesouro Selic 2029 (LFT)',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'Título Público Federal',
    indexer: 'SELIC',
    rate_fixed: 0.15,
    rate_description: 'Selic + 0,15% a.a.',
    maturity_date: '2029-03-01',
    liquidity_type: 'D+0 (Diária)',
    guarantee: 'Tesouro Nacional (Soberano)',
    tax_free: 0,
    min_investment: 145.80,
    default_price: 14580.00
  },
  {
    code: 'TESOURO_IPCA_2029',
    name: 'Tesouro IPCA+ 2029 (NTN-B Principal)',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'Título Público Federal',
    indexer: 'IPCA',
    rate_fixed: 6.35,
    rate_description: 'IPCA + 6,35% a.a.',
    maturity_date: '2029-05-15',
    liquidity_type: 'D+1',
    guarantee: 'Tesouro Nacional (Soberano)',
    tax_free: 0,
    min_investment: 34.20,
    default_price: 3420.50
  },
  {
    code: 'TESOURO_IPCA_2035',
    name: 'Tesouro IPCA+ 2035 (NTN-B Principal)',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'Título Público Federal',
    indexer: 'IPCA',
    rate_fixed: 6.55,
    rate_description: 'IPCA + 6,55% a.a.',
    maturity_date: '2035-05-15',
    liquidity_type: 'D+1',
    guarantee: 'Tesouro Nacional (Soberano)',
    tax_free: 0,
    min_investment: 24.80,
    default_price: 2480.00
  },
  {
    code: 'TESOURO_IPCA_2045',
    name: 'Tesouro IPCA+ 2045 (NTN-B Principal)',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'Título Público Federal',
    indexer: 'IPCA',
    rate_fixed: 6.65,
    rate_description: 'IPCA + 6,65% a.a.',
    maturity_date: '2045-05-15',
    liquidity_type: 'D+1',
    guarantee: 'Tesouro Nacional (Soberano)',
    tax_free: 0,
    min_investment: 13.90,
    default_price: 1390.20
  },
  {
    code: 'TESOURO_RENDA_2035',
    name: 'Tesouro RendA+ 2035 (Aposentadoria)',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'Título Público Federal',
    indexer: 'IPCA',
    rate_fixed: 6.50,
    rate_description: 'IPCA + 6,50% a.a.',
    maturity_date: '2035-12-15',
    liquidity_type: 'D+1',
    guarantee: 'Tesouro Nacional (Soberano)',
    tax_free: 0,
    min_investment: 40.00,
    default_price: 2000.00
  },
  {
    code: 'TESOURO_PRE_2027',
    name: 'Tesouro Prefixado 2027 (LTN)',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'Título Público Federal',
    indexer: 'PREFIXADO',
    rate_fixed: 12.45,
    rate_description: '12,45% a.a.',
    maturity_date: '2027-01-01',
    liquidity_type: 'D+1',
    guarantee: 'Tesouro Nacional (Soberano)',
    tax_free: 0,
    min_investment: 38.50,
    default_price: 770.00
  },
  {
    code: 'TESOURO_PRE_2031',
    name: 'Tesouro Prefixado 2031 (LTN)',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'Título Público Federal',
    indexer: 'PREFIXADO',
    rate_fixed: 12.80,
    rate_description: '12,80% a.a.',
    maturity_date: '2031-01-01',
    liquidity_type: 'D+1',
    guarantee: 'Tesouro Nacional (Soberano)',
    tax_free: 0,
    min_investment: 49.00,
    default_price: 490.00
  },

  // --- TÍTULOS BANCÁRIOS (CDB, LCI, LCA) ---
  {
    code: 'CDB_LIQ_DIARIA',
    name: 'CDB 100% CDI Liquidez Diária',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'CDB Bancário',
    indexer: 'CDI',
    rate_fixed: 100.0,
    rate_description: '100% do CDI',
    maturity_date: 'Liquidez Diária',
    liquidity_type: 'D+0 (Diária)',
    guarantee: 'FGC (até R$ 250k)',
    tax_free: 0,
    min_investment: 1.00,
    default_price: 1000.00
  },
  {
    code: 'CDB_BANCO_110',
    name: 'CDB 110% CDI Médio Prazo',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'CDB Bancário',
    indexer: 'CDI',
    rate_fixed: 110.0,
    rate_description: '110% do CDI',
    maturity_date: '2026-12-15',
    liquidity_type: 'No Vencimento',
    guarantee: 'FGC (até R$ 250k)',
    tax_free: 0,
    min_investment: 1000.00,
    default_price: 1000.00
  },
  {
    code: 'LCI_DI_95',
    name: 'LCI 95% CDI (Isenta de IR)',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'LCI Imobiliária',
    indexer: 'CDI',
    rate_fixed: 95.0,
    rate_description: '95% do CDI (Isento)',
    maturity_date: '2026-06-30',
    liquidity_type: 'No Vencimento',
    guarantee: 'FGC (até R$ 250k)',
    tax_free: 1,
    min_investment: 1000.00,
    default_price: 1000.00
  },
  {
    code: 'LCA_IPCA_58',
    name: 'LCA IPCA + 5,80% (Isenta de IR)',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'LCA Agronegócio',
    indexer: 'IPCA',
    rate_fixed: 5.80,
    rate_description: 'IPCA + 5,80% a.a. (Isento)',
    maturity_date: '2027-05-15',
    liquidity_type: 'No Vencimento',
    guarantee: 'FGC (até R$ 250k)',
    tax_free: 1,
    min_investment: 1000.00,
    default_price: 1000.00
  },

  // --- CRÉDITO PRIVADO (DEBÊNTURES, CRI, CRA) ---
  {
    code: 'DEB_INFRA_AAA',
    name: 'Debênture Incentivada Infraestrutura AAA',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'Debênture Incentivada',
    indexer: 'IPCA',
    rate_fixed: 7.10,
    rate_description: 'IPCA + 7,10% a.a. (Isento)',
    maturity_date: '2030-08-15',
    liquidity_type: 'Mercado Secundário',
    guarantee: 'Rating AAA (Sem FGC)',
    tax_free: 1,
    min_investment: 1000.00,
    default_price: 1000.00
  },
  {
    code: 'CRI_LOGISTICA_AAA',
    name: 'CRI Logístico Galpões AAA',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'CRI Imobiliário',
    indexer: 'IPCA',
    rate_fixed: 7.25,
    rate_description: 'IPCA + 7,25% a.a. (Isento)',
    maturity_date: '2029-11-15',
    liquidity_type: 'Mercado Secundário',
    guarantee: 'Rating AAA (Garantia Real)',
    tax_free: 1,
    min_investment: 1000.00,
    default_price: 1000.00
  },
  {
    code: 'CRA_AGRO_CDI',
    name: 'CRA Cooperativa Agro AAA',
    type: 'RendaFixa',
    market: 'BR',
    sector: 'CRA Agronegócio',
    indexer: 'CDI',
    rate_fixed: 102.5,
    rate_description: 'CDI + 1,20% a.a. (Isento)',
    maturity_date: '2028-04-15',
    liquidity_type: 'Mercado Secundário',
    guarantee: 'Rating AAA (Garantia Fidejussória)',
    tax_free: 1,
    min_investment: 1000.00,
    default_price: 1000.00
  }
];

/**
 * Calcula a rentabilidade anual estimada (dividend_yield) com base no cenário macroeconômico atual do BACEN.
 */
export function calculateEstimatedYield(item, snapshot) {
  let selic = snapshot?.selic || 10.75;
  let cdi = snapshot?.cdi || (selic - 0.1);
  let ipca = snapshot?.ipca12m || 4.5;

  // Se a taxa diária do BACEN for menor que 1 (ex: 0.050788%), anualiza para base 252 dias úteis
  if (selic > 0 && selic < 1.0) {
    selic = (Math.pow(1 + selic / 100, 252) - 1) * 100;
  }
  if (cdi > 0 && cdi < 1.0) {
    cdi = (Math.pow(1 + cdi / 100, 252) - 1) * 100;
  }
  if (ipca > 0 && ipca < 1.0) {
    ipca = (Math.pow(1 + ipca / 100, 12) - 1) * 100;
  }

  if (item.indexer === 'SELIC') {
    return Number((selic + (item.rate_fixed || 0)).toFixed(2));
  }
  if (item.indexer === 'CDI') {
    if (item.rate_fixed >= 50) {
      // É percentual do CDI (ex: 100% do CDI, 110% do CDI)
      return Number(((cdi * item.rate_fixed) / 100).toFixed(2));
    }
    // É CDI + spread (ex: CDI + 1.2%)
    return Number((cdi + item.rate_fixed).toFixed(2));
  }
  if (item.indexer === 'IPCA') {
    // Equação de Fisher: (1 + i) = (1 + inflação) * (1 + juro real) - 1
    const nominal = ((1 + ipca / 100) * (1 + item.rate_fixed / 100) - 1) * 100;
    return Number(nominal.toFixed(2));
  }
  if (item.indexer === 'PREFIXADO') {
    return Number(item.rate_fixed.toFixed(2));
  }
  return 10.0;
}

/**
 * Sincroniza e atualiza toda a base de Renda Fixa no banco de dados SQLite.
 */
export async function syncRendaFixa() {
  console.log('🔄 Sincronizando catálogo de Renda Fixa...');
  
  let snapshot = { selic: 10.75, cdi: 10.65, ipca12m: 4.5 };
  try {
    const liveSnapshot = await getEconomicSnapshot();
    if (liveSnapshot && liveSnapshot.selic) {
      snapshot = liveSnapshot;
    }
  } catch (err) {
    console.warn('⚠️ Não foi possível obter snapshot do BACEN em tempo real, usando estimativas de mercado:', err.message);
  }

  const today = new Date().toISOString().split('T')[0];
  let updatedCount = 0;

  for (const item of RENDA_FIXA_CATALOG) {
    // 1. Cadastra/atualiza o ativo na tabela assets
    upsertAsset({
      code: item.code,
      name: item.name,
      type: 'RendaFixa',
      market: 'BR',
      sector: item.sector
    });

    // 2. Preço de referência
    upsertPrice({
      asset_code: item.code,
      date: today,
      open: item.default_price,
      high: item.default_price,
      low: item.default_price,
      close: item.default_price,
      volume: 1000000
    });

    // 3. Rentabilidade estimada
    const estimatedYield = calculateEstimatedYield(item, snapshot);

    // 4. Salva fundamentos de renda fixa
    insertFundamentals({
      asset_code: item.code,
      dividend_yield: estimatedYield, // Rentabilidade anual estimada (%)
      indexer: item.indexer,
      rate_fixed: item.rate_fixed,
      rate_description: item.rate_description,
      maturity_date: item.maturity_date,
      liquidity_type: item.liquidity_type,
      guarantee: item.guarantee,
      tax_free: item.tax_free,
      min_investment: item.min_investment,
      liquidity: item.liquidity_type.includes('Diária') ? 10000000 : 500000
    });

    updatedCount++;
  }

  console.log(`✅ ${updatedCount} ativos de Renda Fixa sincronizados com sucesso.`);
  return {
    total: updatedCount,
    snapshot
  };
}
