import { initDatabase, filterAssetsByFundamentals } from '../src/services/database.service.js';

initDatabase();

const PRESETS = {
  conservador: {
    Acao: { pe_ratio: { max: 12 }, pb_ratio: { max: 2 }, dividend_yield: { min: 4 }, roe: { min: 15 }, current_ratio: { min: 1.5 }, debt_to_equity: { max: 0.5 } },
    FII: { p_vpa: { min: 0.85, max: 1.05 }, dividend_yield: { min: 9 }, vacancy_rate: { max: 5 }, liquidity: { min: 500000 } },
    RendaFixa: { dividend_yield: { min: 10 } },
    Stock: { pe_ratio: { max: 22 }, pb_ratio: { max: 4 }, dividend_yield: { min: 2.0 }, roe: { min: 15 }, debt_to_equity: { max: 1.0 } },
    REIT: { pe_ratio: { max: 16 }, p_vpa: { max: 1.15 }, dividend_yield: { min: 4.0 }, vacancy_rate: { max: 5 } }
  },
  moderado: {
    Acao: { pe_ratio: { max: 15 }, pb_ratio: { max: 3 }, dividend_yield: { min: 3 }, roe: { min: 10 }, current_ratio: { min: 1.0 }, debt_to_equity: { max: 1.0 } },
    FII: { p_vpa: { min: 0.8, max: 1.15 }, dividend_yield: { min: 7 }, vacancy_rate: { max: 10 }, liquidity: { min: 200000 } },
    RendaFixa: { dividend_yield: { min: 11 } },
    Stock: { pe_ratio: { max: 32 }, pb_ratio: { max: 7 }, dividend_yield: { min: 0.8 }, roe: { min: 15 } },
    REIT: { pe_ratio: { max: 20 }, p_vpa: { max: 1.30 }, dividend_yield: { min: 3.5 }, vacancy_rate: { max: 8 } }
  },
  agressivo: {
    Acao: { pe_ratio: { max: 20 }, pb_ratio: { max: 5 }, dividend_yield: { min: 2 }, roe: { min: 8 } },
    FII: { p_vpa: { min: 0.7, max: 1.3 }, dividend_yield: { min: 5 }, vacancy_rate: { max: 15 } },
    RendaFixa: { dividend_yield: { min: 12 } },
    Stock: { pe_ratio: { max: 45 }, roe: { min: 12 } },
    REIT: { pe_ratio: { max: 26 }, dividend_yield: { min: 2.5 }, vacancy_rate: { max: 12 } }
  }
};

const baskets = {
  conservador: {
    RendaFixa: ['CDB_LIQ_DIARIA', 'TESOURO_SELIC_2027', 'TESOURO_IPCA_2035', 'LCI_DI_95'],
    FII: ['ALZR11', 'BTLG11', 'CPTS11', 'BTCI11', 'AFHI11'],
    Acao: ['GRND3', 'GMAT3', 'DEXP3', 'CEBR3', 'ALLD3'],
    Stock: ['ACN', 'AFL', 'CINF', 'EOG', 'FIS'],
    REIT: ['O', 'AMH', 'ADC', 'AIV']
  },
  moderado: {
    RendaFixa: ['CDB_LIQ_DIARIA', 'TESOURO_IPCA_2035'],
    FII: ['BTLG11', 'ALZR11', 'CPTS11', 'BCIA11', 'TGAR11'],
    Acao: ['BBAS3', 'ALUP11', 'ABCB4', 'GRND3', 'GMAT3'],
    Stock: ['AAPL', 'ACN', 'AFL', 'JNJ', 'PG'],
    REIT: ['O', 'VICI', 'STAG', 'ADC', 'PLD']
  },
  agressivo: {
    RendaFixa: ['CDB_LIQ_DIARIA', 'TESOURO_SELIC_2027'],
    FII: ['BTLG11', 'ALZR11', 'CPTS11', 'TGAR11', 'XPML11'],
    Acao: ['BBAS3', 'ABEV3', 'ALUP11', 'VALE3', 'ITUB4'],
    Stock: ['MSFT', 'NVDA', 'GOOGL', 'AMZN', 'AAPL'],
    REIT: ['DLR', 'PLD', 'O', 'AMT']
  }
};

for (const [profile, classes] of Object.entries(baskets)) {
  console.log(`\nVerificando Cesta do perfil: ${profile.toUpperCase()}`);
  for (const [category, codes] of Object.entries(classes)) {
    const approved = filterAssetsByFundamentals(category, PRESETS[profile][category]).map(a => a.code);
    const approvedSet = new Set(approved);
    
    for (const code of codes) {
      const isApproved = approvedSet.has(code);
      if (!isApproved) {
        console.warn(`⚠️ [${profile}] ${category} ${code} NÃO passou no filtro estrito!`);
      } else {
        console.log(`✅ [${profile}] ${category} ${code} APROVADO 100%`);
      }
    }
  }
}
