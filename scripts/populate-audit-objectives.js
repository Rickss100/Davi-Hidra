import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../investment-data.db');

const USERS_CONFIG = [
  {
    email: 'servidor.conservador@norteinvest.com',
    macroTargets: { fixed: 28.0, fiis: 21.0, acoes: 13.0, stocks: 28.0, reits: 10.0 },
    basket: {
      RendaFixa: ['TESOURO_SELIC_2027', 'TESOURO_IPCA_2035'],
      FII: ['ALZR11', 'BTLG11', 'CPTS11', 'BTCI11', 'AFHI11'],
      Acao: ['GRND3', 'GMAT3', 'CEBR3', 'DEXP3', 'ALLD3'],
      Stock: ['ACN', 'AFL', 'CINF', 'EOG', 'FIS'],
      REIT: ['O', 'ADC', 'AMH', 'AIV']
    }
  },
  {
    email: 'servidor.moderado@norteinvest.com',
    macroTargets: { fixed: 12.0, fiis: 24.0, acoes: 20.0, stocks: 31.0, reits: 13.0 },
    basket: {
      RendaFixa: ['TESOURO_IPCA_2035'],
      FII: ['BTLG11', 'ALZR11', 'CPTS11', 'BCIA11', 'TGAR11'],
      Acao: ['BBAS3', 'ALUP11', 'ABCB4', 'GRND3', 'GMAT3'],
      Stock: ['ACN', 'AFL', 'AXP', 'PG', 'ALL'],
      REIT: ['O', 'ADC', 'VICI', 'STAG']
    }
  },
  {
    email: 'servidor.agressivo@norteinvest.com',
    macroTargets: { fixed: 5.0, fiis: 22.0, acoes: 33.0, stocks: 34.0, reits: 6.0 },
    basket: {
      RendaFixa: ['TESOURO_SELIC_2027'],
      FII: ['BTLG11', 'ALZR11', 'CPTS11', 'TGAR11', 'XPML11'],
      Acao: ['BBAS3', 'VALE3', 'ITUB4', 'ALUP11', 'ABEV3'],
      Stock: ['NVDA', 'MSFT', 'AAPL', 'AMZN', 'GOOGL'],
      REIT: ['DLR', 'PLD', 'O', 'AMT']
    }
  }
];

function populateObjectives() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database not found at', DB_PATH);
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  // Garantir que a tabela existe
  db.prepare(`
    CREATE TABLE IF NOT EXISTS user_objectives (
      user_id   INTEGER PRIMARY KEY,
      macro_allocation TEXT NOT NULL DEFAULT '{}',
      asset_targets    TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `).run();

  const insertStmt = db.prepare(`
    INSERT INTO user_objectives (user_id, macro_allocation, asset_targets)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      macro_allocation = excluded.macro_allocation,
      asset_targets = excluded.asset_targets
  `);

  let successCount = 0;

  for (const config of USERS_CONFIG) {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(config.email);
    if (!user) {
      console.warn(`User ${config.email} not found in DB. Skipping.`);
      continue;
    }

    const assetTargets = {
      acoes: config.basket.Acao.map(code => ({ ticker: code, quantity: 1, idealPercentage: 0 })),
      fiis: config.basket.FII.map(code => ({ ticker: code, quantity: 1, idealPercentage: 0 })),
      stocks: config.basket.Stock.map(code => ({ ticker: code, quantity: 1, idealPercentage: 0 })),
      reits: config.basket.REIT.map(code => ({ ticker: code, quantity: 1, idealPercentage: 0 })),
      fixed: config.basket.RendaFixa.map(code => ({ ticker: code, quantity: 1, idealPercentage: 0 }))
    };

    insertStmt.run(user.id, JSON.stringify(config.macroTargets), JSON.stringify(assetTargets));
    console.log(`✅ Populated objectives for ${config.email} (ID: ${user.id})`);
    successCount++;
  }

  console.log(`\n🎉 Populated objectives for ${successCount} audit users.`);
  db.close();
}

populateObjectives();
