/**
 * Script para forçar a sincronização de dados locais para o Turso Cloud
 * Uso:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node src/scripts/sync_to_turso.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { syncWithTursoOnStartup, getTursoStatus } from '../services/turso.service.js';

async function main() {
  console.log('🔄 Iniciando teste e sincronização com Turso Cloud...');

  const status = await getTursoStatus();
  console.log('Status Turso:', status);

  if (!status.configured) {
    console.error('❌ Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN para executar a sincronização.');
    process.exit(1);
  }

  const dbPath = path.join(process.cwd(), 'investment-data.db');
  const localDb = new Database(dbPath);

  await syncWithTursoOnStartup(localDb);
  console.log('🎉 Sincronização concluída com sucesso!');
  localDb.close();
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
