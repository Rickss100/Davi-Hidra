const Database = require('better-sqlite3');
const db = new Database('./investment-data.db');

const userId = 1;

try {
  const macroAllocation = {
    acoes: 30,
    fiis: 20,
    stocks: 25,
    reits: 10,
    rendaFixa: 15
  };

  const assetTargets = {
    // AÇÕES (Total 100%)
    'ITUB4': { category: 'Acoes', sector: 'Financeiro', percentage: 20 },
    'BBAS3': { category: 'Acoes', sector: 'Financeiro', percentage: 15 },
    'WEGE3': { category: 'Acoes', sector: 'Bens Industriais', percentage: 15 },
    'EGIE3': { category: 'Acoes', sector: 'Utilidade Pública', percentage: 15 },
    'ALUP11': { category: 'Acoes', sector: 'Utilidade Pública', percentage: 15 },
    'SAPR11': { category: 'Acoes', sector: 'Saneamento', percentage: 10 },
    'VALE3': { category: 'Acoes', sector: 'Materiais Básicos', percentage: 10 },

    // FIIs (Total 100%)
    'ALZR11': { category: 'FIIs', sector: 'Híbrido', percentage: 20 },
    'XPML11': { category: 'FIIs', sector: 'Shoppings', percentage: 20 },
    'HGLG11': { category: 'FIIs', sector: 'Logística', percentage: 20 },
    'KNCR11': { category: 'FIIs', sector: 'Papel', percentage: 20 },
    'KNIP11': { category: 'FIIs', sector: 'Papel', percentage: 20 },

    // STOCKS (Total 100%)
    'AAPL': { category: 'Stocks', sector: 'Tecnologia', percentage: 20 },
    'MSFT': { category: 'Stocks', sector: 'Tecnologia', percentage: 20 },
    'JNJ': { category: 'Stocks', sector: 'Saúde', percentage: 15 },
    'PG': { category: 'Stocks', sector: 'Consumo Não Cíclico', percentage: 15 },
    'KO': { category: 'Stocks', sector: 'Consumo Não Cíclico', percentage: 15 },
    'GOOGL': { category: 'Stocks', sector: 'Serviços de Comunicação', percentage: 15 },

    // REITs (Total 100%)
    'O': { category: 'REITs', sector: 'Varejo', percentage: 30 },
    'AMT': { category: 'REITs', sector: 'Infraestrutura', percentage: 25 },
    'PLD': { category: 'REITs', sector: 'Logística', percentage: 25 },
    'DLR': { category: 'REITs', sector: 'Data Centers', percentage: 20 },

    // RENDA FIXA (Total 100%)
    'Tesouro IPCA+ 2035': { category: 'Renda Fixa', sector: 'Títulos Públicos', percentage: 40 },
    'Tesouro IPCA+ 2045': { category: 'Renda Fixa', sector: 'Títulos Públicos', percentage: 30 },
    'Tesouro Selic 2029': { category: 'Renda Fixa', sector: 'Títulos Públicos', percentage: 30 }
  };

  const macroStr = JSON.stringify(macroAllocation);
  const assetStr = JSON.stringify(assetTargets);

  // Check if exists
  const existing = db.prepare('SELECT 1 FROM user_objectives WHERE user_id = ?').get(userId);
  if (existing) {
    db.prepare('UPDATE user_objectives SET macro_allocation = ?, asset_targets = ?, updated_at = datetime("now") WHERE user_id = ?').run(macroStr, assetStr, userId);
  } else {
    db.prepare('INSERT INTO user_objectives (user_id, macro_allocation, asset_targets) VALUES (?, ?, ?)').run(userId, macroStr, assetStr);
  }

  console.log('✅ Padrão Ouro inserido no SQLite na tabela user_objectives!');
} catch (error) {
  console.error('❌ Erro:', error);
}
