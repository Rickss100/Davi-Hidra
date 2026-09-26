import { initDatabase, filterAssetsByFundamentals } from '../src/services/database.service.js';

initDatabase();

const PRESETS_MOD = {
  Stock: { pe_ratio: { max: 32 }, pb_ratio: { max: 7 }, dividend_yield: { min: 0.8 }, roe: { min: 15 } },
  REIT: { pe_ratio: { max: 20 }, p_vpa: { max: 1.30 }, dividend_yield: { min: 3.5 }, vacancy_rate: { max: 8 } }
};

const stocks = filterAssetsByFundamentals('Stock', PRESETS_MOD.Stock);
console.log('Top Stocks Moderado aprovadas (109 no total):');
for (const s of stocks.slice(0, 15)) {
  console.log(`- ${s.code} (${s.name}): P/L=${s.pe_ratio}, P/VP=${s.pb_ratio}, DY=${s.dividend_yield}%, ROE=${s.roe}%`);
}

const reits = filterAssetsByFundamentals('REIT', PRESETS_MOD.REIT);
console.log('\nTop REITs Moderado aprovados (203 no total):');
for (const r of reits.slice(0, 15)) {
  console.log(`- ${r.code} (${r.name}): P/L=${r.pe_ratio}, P/VP=${r.p_vpa}, DY=${r.dividend_yield}%, Vac=${r.vacancy_rate}%`);
}
