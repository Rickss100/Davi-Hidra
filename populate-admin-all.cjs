const Database = require('better-sqlite3');
const db = new Database('./investment-data.db');

try {
  // Configurando Macro Alocação
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

  // We are going to apply to all users that might be the admin
  // user_id 1 (Ricardo Arthur)
  // user_id 38 (Eduardo - exactly matches the screenshot's empty targets)
  // Or any user that has 'Rickss100' in name or email.
  
  const usersToUpdate = db.prepare(`SELECT id, name FROM users WHERE id IN (1, 38) OR name LIKE '%Rickss100%' OR email LIKE '%Rickss100%'`).all();
  
  for (const u of usersToUpdate) {
    const exist = db.prepare('SELECT 1 FROM user_objectives WHERE user_id=?').get(u.id);
    if (exist) {
      db.prepare('UPDATE user_objectives SET macro_allocation=?, asset_targets=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?').run(macroStr, assetStr, u.id);
    } else {
      db.prepare('INSERT INTO user_objectives(user_id, macro_allocation, asset_targets) VALUES(?, ?, ?)').run(u.id, macroStr, assetStr);
    }
    console.log(`✅ Padrão Ouro inserido para o usuário: ${u.name} (ID: ${u.id})`);
  }

} catch (error) {
  console.error('❌ Erro:', error);
}
