import Database from 'better-sqlite3';

const db = new Database('investment-data.db');

// PRESETS exatos do DaviFilters.jsx
const PRESETS = {
  conservador: {
    acoes: { pe_ratio: { max: 12 }, pb_ratio: { max: 2 }, dividend_yield: { min: 4 }, roe: { min: 15 }, current_ratio: { min: 1.5 }, debt_to_equity: { max: 0.5 } },
    fiis: { p_vpa: { min: 0.85, max: 1.05 }, dividend_yield: { min: 9 }, vacancy_rate: { max: 5 }, liquidity: { min: 500000 } },
    rendaFixa: { dividend_yield: { min: 10 } },
    stocks: { pe_ratio: { max: 22 }, pb_ratio: { max: 4 }, dividend_yield: { min: 2.0 }, roe: { min: 15 }, debt_to_equity: { max: 1.0 } },
    reits: { pe_ratio: { max: 16 }, p_vpa: { max: 1.15 }, dividend_yield: { min: 4.0 }, vacancy_rate: { max: 5 } }
  },
  moderado: {
    acoes: { pe_ratio: { max: 15 }, pb_ratio: { max: 3 }, dividend_yield: { min: 3 }, roe: { min: 10 }, current_ratio: { min: 1.0 }, debt_to_equity: { max: 1.0 } },
    fiis: { p_vpa: { min: 0.8, max: 1.15 }, dividend_yield: { min: 7 }, vacancy_rate: { max: 10 }, liquidity: { min: 200000 } },
    rendaFixa: { dividend_yield: { min: 11 } },
    stocks: { pe_ratio: { max: 32 }, pb_ratio: { max: 7 }, dividend_yield: { min: 0.8 }, roe: { min: 15 } },
    reits: { pe_ratio: { max: 20 }, p_vpa: { max: 1.30 }, dividend_yield: { min: 3.5 }, vacancy_rate: { max: 8 } }
  },
  agressivo: {
    acoes: { pe_ratio: { max: 20 }, pb_ratio: { max: 5 }, dividend_yield: { min: 2 }, roe: { min: 8 } },
    fiis: { p_vpa: { min: 0.7, max: 1.3 }, dividend_yield: { min: 5 }, vacancy_rate: { max: 15 } },
    rendaFixa: { dividend_yield: { min: 12 } },
    stocks: { pe_ratio: { max: 45 }, roe: { min: 12 } },
    reits: { pe_ratio: { max: 26 }, dividend_yield: { min: 2.5 }, vacancy_rate: { max: 12 } }
  }
};

const assets = db.prepare(`
  SELECT a.code, a.name, a.type, a.market, a.sector,
         f.pe_ratio, f.pb_ratio, f.dividend_yield, f.roe, f.current_ratio, 
         f.debt_to_equity, f.p_vpa, f.vacancy_rate, f.liquidity, f.rate_fixed
  FROM assets a
  LEFT JOIN fundamentals f ON a.code = f.asset_code
`).all();

console.log('Total de ativos no banco:', assets.length);

// Mapeamento de tipos no banco
const typeCount = {};
for (const a of assets) {
  typeCount[a.type] = (typeCount[a.type] || 0) + 1;
}
console.log('Distribuição por tipo no banco:', typeCount);

function matchesFilter(asset, criteria) {
  if (!criteria) return false;
  for (const [key, rule] of Object.entries(criteria)) {
    let val = asset[key];
    // Tratamento para renda fixa cujo yield pode estar em dividend_yield ou rate_fixed
    if (key === 'dividend_yield' && (asset.type === 'renda_fixa' || asset.type === 'fixed_income')) {
      val = val ?? asset.rate_fixed;
    }
    if (val === null || val === undefined) return false;
    if (rule.min !== undefined && val < rule.min) return false;
    if (rule.max !== undefined && val > rule.max) return false;
  }
  return true;
}

for (const [profileKey, filters] of Object.entries(PRESETS)) {
  console.log(`\n========================================`);
  console.log(`PERFIL: ${profileKey.toUpperCase()}`);
  console.log(`========================================`);

  const acoes = assets.filter(a => (a.type === 'stock_br' || a.type === 'acao') && matchesFilter(a, filters.acoes));
  const fiis = assets.filter(a => a.type === 'fii' && matchesFilter(a, filters.fiis));
  const rf = assets.filter(a => (a.type === 'fixed_income' || a.type === 'renda_fixa') && matchesFilter(a, filters.rendaFixa));
  const stocks = assets.filter(a => (a.type === 'stock_us' || a.type === 'stock') && matchesFilter(a, filters.stocks));
  const reits = assets.filter(a => a.type === 'reit' && matchesFilter(a, filters.reits));

  console.log(`Ações BR aprovadas (${acoes.length}):`, acoes.map(a => `${a.code} [P/L:${a.pe_ratio}, DY:${a.dividend_yield}%, ROE:${a.roe}%, Dív/PL:${a.debt_to_equity}]`).join(' | '));
  console.log(`FIIs aprovados (${fiis.length}):`, fiis.map(a => `${a.code} [P/VP:${a.p_vpa}, DY:${a.dividend_yield}%, Vac:${a.vacancy_rate}%]`).join(' | '));
  console.log(`Renda Fixa aprovada (${rf.length}):`, rf.map(a => `${a.code} [Yield:${a.dividend_yield || a.rate_fixed}%]`).join(' | '));
  console.log(`Stocks US aprovadas (${stocks.length}):`, stocks.map(a => `${a.code} [P/L:${a.pe_ratio}, DY:${a.dividend_yield}%, ROE:${a.roe}%]`).join(' | '));
  console.log(`REITs aprovados (${reits.length}):`, reits.map(a => `${a.code} [P/L:${a.pe_ratio}, DY:${a.dividend_yield}%, Vac:${a.vacancy_rate}%]`).join(' | '));
}

db.close();
