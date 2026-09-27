import { getTursoClient } from './src/services/turso.service.js';

async function clean() {
  const c = getTursoClient();
  await c.execute('DELETE FROM transactions WHERE asset_code="Tesouro Selic 2029"');
  console.log('Limpeza concluída');
}

clean().catch(console.error);
