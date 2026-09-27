import { getTursoClient } from '../services/turso.service.js';
import Database from 'better-sqlite3';

async function updateObjectives() {
  const client = getTursoClient();
  const localDb = new Database('./investment-data.db');

  const usersToUpdate = [1, 38];

  const macroAllocation = {
    fixed: 15,
    variable: 85,
    brasil: 60,
    usa: 40,
    acoes: 60,
    fiis: 40,
    stocks: 70,
    reits: 30
  };

  const macroStr = JSON.stringify(macroAllocation);

  for (const uid of usersToUpdate) {
    try {
      await client.execute({
        sql: `UPDATE user_objectives SET macro_allocation = ? WHERE user_id = ?`,
        args: [macroStr, uid]
      });
      console.log(`✅ Macro atualizado no Turso para user ${uid}`);
    } catch (e) {
      console.error(e);
    }
    
    try {
      localDb.prepare(`UPDATE user_objectives SET macro_allocation = ? WHERE user_id = ?`).run(macroStr, uid);
      console.log(`✅ Macro atualizado Localmente para user ${uid}`);
    } catch (e) {
      console.error(e);
    }
  }

  localDb.close();
  console.log('Feito!');
}

updateObjectives().catch(console.error);
