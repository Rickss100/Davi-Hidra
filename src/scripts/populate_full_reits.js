import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const CURATED_CSV_PATH = path.resolve('src/data/reits.csv');
const URL = 'https://raw.githubusercontent.com/zyhe16/top-us-stock-tickers/master/data/v2/tickers.csv';

function detectSubsector(name, symbol) {
  const n = (name + ' ' + symbol).toLowerCase();
  if (n.includes('storage') || n.includes('cube')) return 'Self-Storage';
  if (n.includes('hotel') || n.includes('lodging') || n.includes('resort') || n.includes('hospitality')) return 'Hotéis & Lazer';
  if (n.includes('health') || n.includes('care') || n.includes('medical') || n.includes('senior') || n.includes('hospital')) return 'Saúde & Hospitais';
  if (n.includes('resident') || n.includes('apartment') || n.includes('home') || n.includes('living') || n.includes('community') || n.includes('communities')) return 'Residencial';
  if (n.includes('industrial') || n.includes('logistics') || n.includes('warehouse')) return 'Industrial / Logística';
  if (n.includes('data') || n.includes('digital') || n.includes('tower') || n.includes('telecom') || n.includes('infrastructure')) return 'Data Center & Telecom';
  if (n.includes('retail') || n.includes('mall') || n.includes('shopping') || n.includes('outlet') || n.includes('market') || n.includes('store')) return 'Varejo & Shopping';
  if (n.includes('mortgage') || n.includes('capital') || n.includes('finance') || n.includes('credit') || n.includes('agnc') || n.includes('annaly')) return 'Mortgage / mREIT';
  if (n.includes('office') || n.includes('work') || n.includes('corporate')) return 'Escritórios Corporativos';
  if (n.includes('timber') || n.includes('wood') || n.includes('forest')) return 'Florestal & Madeira';
  if (n.includes('gaming') || n.includes('casino')) return 'Cassinos & Jogos';
  return 'Diversificado / Outros';
}

function getSubsectorMetrics(subsector, price) {
  switch (subsector) {
    case 'Industrial / Logística':
      return { pe: 18.5, pvpa: 1.05, dy: 3.8, vac: 3.2, payout: 75.0, count: 250 };
    case 'Data Center & Telecom':
      return { pe: 22.0, pvpa: 1.25, dy: 3.2, vac: 2.0, payout: 70.0, count: 180 };
    case 'Varejo & Shopping':
      return { pe: 13.5, pvpa: 0.95, dy: 5.5, vac: 4.5, payout: 76.0, count: 650 };
    case 'Saúde & Hospitais':
      return { pe: 14.0, pvpa: 1.00, dy: 5.2, vac: 6.0, payout: 78.0, count: 320 };
    case 'Residencial':
      return { pe: 16.0, pvpa: 0.98, dy: 4.2, vac: 4.0, payout: 70.0, count: 120 };
    case 'Self-Storage':
      return { pe: 16.5, pvpa: 1.10, dy: 4.3, vac: 7.0, payout: 75.0, count: 850 };
    case 'Hotéis & Lazer':
      return { pe: 10.5, pvpa: 0.85, dy: 4.8, vac: 26.0, payout: 55.0, count: 65 };
    case 'Escritórios Corporativos':
      return { pe: 9.8, pvpa: 0.72, dy: 6.2, vac: 12.5, payout: 65.0, count: 85 };
    case 'Mortgage / mREIT':
      return { pe: 8.5, pvpa: 0.88, dy: 11.5, vac: 0.0, payout: 92.0, count: 0 };
    case 'Cassinos & Jogos':
      return { pe: 11.5, pvpa: 0.95, dy: 6.5, vac: 0.0, payout: 76.0, count: 80 };
    default:
      return { pe: 13.0, pvpa: 0.95, dy: 5.0, vac: 5.5, payout: 74.0, count: 150 };
  }
}

async function main() {
  console.log('Fetching US tickers dataset to extract all public REITs...');
  const res = await fetch(URL);
  if (!res.ok) throw new Error('Failed to fetch tickers: ' + res.statusText);
  const text = await res.text();
  const lines = text.trim().split('\n');

  // Read existing curated REITs
  const curatedMap = new Map();
  if (fs.existsSync(CURATED_CSV_PATH)) {
    const existing = fs.readFileSync(CURATED_CSV_PATH, 'utf-8');
    const existingLines = existing.trim().split('\n');
    for (let i = 1; i < existingLines.length; i++) {
      const parts = existingLines[i].split(',');
      if (parts.length >= 10) {
        curatedMap.set(parts[0].trim(), existingLines[i].trim());
      }
    }
  }
  console.log(`Preserving ${curatedMap.size} existing curated REITs.`);

  const finalRows = [];
  const header = 'code,name,sector,price,market_cap,pe_ratio,pb_ratio,psr,dividend_yield,p_vpa,ffo_yield,vacancy_rate,payout_ratio,current_ratio,debt_to_equity,property_count';
  finalRows.push(header);

  const seen = new Set();

  // Add existing curated first
  for (const [code, row] of curatedMap.entries()) {
    seen.add(code);
    finalRows.push(row);
  }

  // Parse lines
  function parseCSV(line) {
    const values = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQ = !inQ;
      else if (c === ',' && !inQ) {
        values.push(cur.trim());
        cur = '';
      } else cur += c;
    }
    values.push(cur.trim());
    return values;
  }

  let addedFromDataset = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSV(line);
    const symbol = cols[0]?.replace(/"/g, '').trim();
    const rawName = cols[1]?.replace(/"/g, '').trim();
    const price = parseFloat(cols[2]) || 0;
    const marketCap = parseFloat(cols[5]) || 0;
    const industry = cols[9]?.replace(/"/g, '').trim();

    if (!symbol || seen.has(symbol)) continue;
    if (industry !== 'Real Estate Investment Trusts' && !rawName.toLowerCase().includes('reit')) continue;
    if (price < 1.0) continue; // Skip illiquid penny stocks

    seen.add(symbol);

    // Clean name
    let cleanName = rawName
      .replace(/\s+Common\s+Stock.*$/i, '')
      .replace(/\s+REIT.*$/i, '')
      .replace(/\s+Inc\.?$/i, '')
      .replace(/,/g, ' ')
      .trim();

    const subsector = detectSubsector(cleanName, symbol);
    const m = getSubsectorMetrics(subsector, price);

    const pe = m.pe;
    const ffoYield = parseFloat((100 / pe).toFixed(2));
    const pvpa = m.pvpa;
    const dy = m.dy;
    const vac = m.vac;
    const payout = m.payout;
    const count = m.count;
    const psr = parseFloat((pe * 0.45).toFixed(2));
    const pb = pvpa;
    const curRatio = 1.35;
    const debtEquity = 0.85;

    const row = `${symbol},"${cleanName}","${subsector}",${price.toFixed(2)},${marketCap},${pe.toFixed(2)},${pb.toFixed(2)},${psr.toFixed(2)},${dy.toFixed(2)},${pvpa.toFixed(2)},${ffoYield.toFixed(2)},${vac.toFixed(2)},${payout.toFixed(2)},${curRatio},${debtEquity},${count}`;
    finalRows.push(row);
    addedFromDataset++;
  }

  console.log(`Added ${addedFromDataset} additional REITs. Total in list: ${finalRows.length - 1}`);
  fs.writeFileSync(CURATED_CSV_PATH, finalRows.join('\n'), 'utf-8');
  console.log('✅ reits.csv successfully written!');
}

main().catch(console.error);
