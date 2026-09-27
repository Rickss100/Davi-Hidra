const Database = require('better-sqlite3');
const db = new Database('./investment-data.db');

try {
  const macroAllocation = {
    fixed: 15,
    variable: 85,
    brasil: 50,
    usa: 35,
    acoes: 30,
    fiis: 20,
    stocks: 25,
    reits: 10
  };

  // Alterado 'percentage' para 'target' conforme AssetTargetTable.jsx espera!
  const assetTargets = {
    acoes: [
      { code: 'ITUB4', sector: 'Financeiro', target: 20 },
      { code: 'BBAS3', sector: 'Financeiro', target: 15 },
      { code: 'WEGE3', sector: 'Bens Industriais', target: 15 },
      { code: 'EGIE3', sector: 'Utilidade Pública', target: 15 },
      { code: 'ALUP11', sector: 'Utilidade Pública', target: 15 },
      { code: 'SAPR11', sector: 'Saneamento', target: 10 },
      { code: 'VALE3', sector: 'Materiais Básicos', target: 10 }
    ],
    fiis: [
      { code: 'ALZR11', sector: 'Híbrido', target: 20 },
      { code: 'XPML11', sector: 'Shoppings', target: 20 },
      { code: 'HGLG11', sector: 'Logística', target: 20 },
      { code: 'KNCR11', sector: 'Papel', target: 20 },
      { code: 'KNIP11', sector: 'Papel', target: 20 }
    ],
    stocks: [
      { code: 'AAPL', sector: 'Tecnologia', target: 20 },
      { code: 'MSFT', sector: 'Tecnologia', target: 20 },
      { code: 'JNJ', sector: 'Saúde', target: 15 },
      { code: 'PG', sector: 'Consumo Não Cíclico', target: 15 },
      { code: 'KO', sector: 'Consumo Não Cíclico', target: 15 },
      { code: 'GOOGL', sector: 'Serviços de Comunicação', target: 15 }
    ],
    reits: [
      { code: 'O', sector: 'Varejo', target: 30 },
      { code: 'AMT', sector: 'Infraestrutura', target: 25 },
      { code: 'PLD', sector: 'Logística', target: 25 },
      { code: 'DLR', sector: 'Data Centers', target: 20 }
    ],
    fixed: [
      { code: 'Tesouro IPCA+ 2035', sector: 'Títulos Públicos', target: 40 },
      { code: 'Tesouro IPCA+ 2045', sector: 'Títulos Públicos', target: 30 },
      { code: 'Tesouro Selic 2029', sector: 'Títulos Públicos', target: 30 }
    ]
  };

  const macroStr = JSON.stringify(macroAllocation);
  const assetStr = JSON.stringify(assetTargets);

  // Apply to all possible admin/Rickss100 accounts (including ID 38 which matches the user's screenshot exactly)
  const usersToUpdate = db.prepare(`SELECT id, name FROM users WHERE id IN (1, 38) OR name LIKE '%Rickss100%' OR email LIKE '%Rickss100%'`).all();
  
  for (const u of usersToUpdate) {
    const exist = db.prepare('SELECT 1 FROM user_objectives WHERE user_id=?').get(u.id);
    if (exist) {
      db.prepare('UPDATE user_objectives SET macro_allocation=?, asset_targets=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?').run(macroStr, assetStr, u.id);
    } else {
      db.prepare('INSERT INTO user_objectives(user_id, macro_allocation, asset_targets) VALUES(?, ?, ?)').run(u.id, macroStr, assetStr);
    }
    console.log(`✅ Padrão Ouro corrigido (target) inserido para o usuário: ${u.name} (ID: ${u.id})`);
  }

} catch (error) {
  console.error('❌ Erro:', error);
}
