import Database from 'better-sqlite3';

const db = new Database('investment-data.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tabelas no banco:', tables.map(t => t.name));

for (const t of ['assets', 'fundamentals', 'prices', 'historical_prices', 'transactions', 'dividends']) {
  if (tables.some(tbl => tbl.name === t)) {
    const cols = db.prepare(`PRAGMA table_info(${t})`).all();
    console.log(`\nColunas de ${t}:`, cols.map(c => `${c.name} (${c.type})`).join(', '));
  }
}

db.close();
