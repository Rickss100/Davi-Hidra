const Database = require('better-sqlite3');
const db = new Database('./investment-data.db');

const userId = 1; // Admin user

try {
  // Configurando Macro Alocação (A soma de brasil+usa deve ser = variable)
  const macroAllocation = {
    fixed: 15, // Renda Fixa
    variable: 85, // Renda Variável
    brasil: 50, // Ações (30%) + FIIs (20%)
    usa: 35, // Stocks (25%) + REITs (10%)
    acoes: 30,
    fiis: 20,
    stocks: 25,
    reits: 10
  };

  // Configurando Alvos de Ativos Exatos
  const assetTargets = {
    acoes: [
      { code: 'ITUB4', sector: 'Financeiro', percentage: 20 },
      { code: 'BBAS3', sector: 'Financeiro', percentage: 15 },
      { code: 'WEGE3', sector: 'Bens Industriais', percentage: 15 },
      { code: 'EGIE3', sector: 'Utilidade Pública', percentage: 15 },
      { code: 'ALUP11', sector: 'Utilidade Pública', percentage: 15 },
      { code: 'SAPR11', sector: 'Saneamento', percentage: 10 },
      { code: 'VALE3', sector: 'Materiais Básicos', percentage: 10 }
    ],
    fiis: [
      { code: 'ALZR11', sector: 'Híbrido', percentage: 20 },
      { code: 'XPML11', sector: 'Shoppings', percentage: 20 },
      { code: 'HGLG11', sector: 'Logística', percentage: 20 },
      { code: 'KNCR11', sector: 'Papel', percentage: 20 },
      { code: 'KNIP11', sector: 'Papel', percentage: 20 }
    ],
    stocks: [
      { code: 'AAPL', sector: 'Tecnologia', percentage: 20 },
      { code: 'MSFT', sector: 'Tecnologia', percentage: 20 },
      { code: 'JNJ', sector: 'Saúde', percentage: 15 },
      { code: 'PG', sector: 'Consumo Não Cíclico', percentage: 15 },
      { code: 'KO', sector: 'Consumo Não Cíclico', percentage: 15 },
      { code: 'GOOGL', sector: 'Serviços de Comunicação', percentage: 15 }
    ],
    reits: [
      { code: 'O', sector: 'Varejo', percentage: 30 },
      { code: 'AMT', sector: 'Infraestrutura', percentage: 25 },
      { code: 'PLD', sector: 'Logística', percentage: 25 },
      { code: 'DLR', sector: 'Data Centers', percentage: 20 }
    ],
    fixed: [
      { code: 'Tesouro IPCA+ 2035', sector: 'Títulos Públicos', percentage: 40 },
      { code: 'Tesouro IPCA+ 2045', sector: 'Títulos Públicos', percentage: 30 },
      { code: 'Tesouro Selic 2029', sector: 'Títulos Públicos', percentage: 30 }
    ]
  };

  const macroStr = JSON.stringify(macroAllocation);
  const assetStr = JSON.stringify(assetTargets);

  const exist = db.prepare('SELECT 1 FROM user_objectives WHERE user_id=?').get(userId);
  if (exist) {
    db.prepare('UPDATE user_objectives SET macro_allocation=?, asset_targets=?, updated_at=datetime("now") WHERE user_id=?').run(macroStr, assetStr, userId);
  } else {
    db.prepare('INSERT INTO user_objectives(user_id, macro_allocation, asset_targets) VALUES(?, ?, ?)').run(userId, macroStr, assetStr);
  }
  
  console.log('✅ Padrão Ouro inserido no SQLite (formato array) com sucesso!');
} catch (error) {
  console.error('❌ Erro:', error);
}
