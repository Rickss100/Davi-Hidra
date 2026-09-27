import Database from 'better-sqlite3';
import { getTursoClient } from '../services/turso.service.js';

async function syncObjectivesToTurso() {
  console.log('🔄 Sincronizando user_objectives para o Turso...');
  
  const client = getTursoClient();
  if (!client) {
    console.error('❌ Cliente Turso não configurado nas env vars.');
    process.exit(1);
  }

  // Criar tabela no Turso se não existir
  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_objectives (
      user_id INTEGER PRIMARY KEY,
      macro_allocation TEXT NOT NULL DEFAULT '{}',
      asset_targets TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Schema user_objectives garantido no Turso.');

  // Pegar do SQLite local
  const localDb = new Database('./investment-data.db');
  const localObjectives = localDb.prepare('SELECT * FROM user_objectives').all();

  console.log(`Encontrados ${localObjectives.length} objetivos no banco local.`);

  for (const obj of localObjectives) {
    try {
      await client.execute({
        sql: `INSERT INTO user_objectives (user_id, macro_allocation, asset_targets, updated_at) 
              VALUES (?, ?, ?, ?) 
              ON CONFLICT(user_id) DO UPDATE SET 
                macro_allocation = excluded.macro_allocation, 
                asset_targets = excluded.asset_targets, 
                updated_at = excluded.updated_at`,
        args: [
          obj.user_id,
          obj.macro_allocation,
          obj.asset_targets,
          obj.updated_at || new Date().toISOString()
        ]
      });
      console.log(`✅ user_id ${obj.user_id} sincronizado com sucesso no Turso.`);
    } catch (e) {
      console.error(`❌ Erro ao sincronizar user_id ${obj.user_id}:`, e.message);
    }
  }

  console.log('🎉 Sincronização de objectives concluída!');
  localDb.close();
}

syncObjectivesToTurso().catch(e => console.error(e));
