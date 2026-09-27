import Database from 'better-sqlite3';
import { getTursoClient } from '../services/turso.service.js';

async function inject20k() {
  console.log('💸 Injetando 20 mil reais (ITUB4) na conta do Padrão Ouro...');
  
  const client = getTursoClient();
  const localDb = new Database('./investment-data.db');
  
  const idResult = await client.execute('SELECT MAX(id) as max_id FROM transactions');
  const nextId = (Number(idResult.rows[0].max_id) || 1000) + 1;

  const usersToFund = [1, 38];

  for (const uid of usersToFund) {
    const tx = {
      id: nextId + uid,
      asset_code: 'ITUB4',
      type: 'buy',
      quantity: 588.23,
      price: 34.00,
      total_value: 20000.00,
      date: new Date().toISOString().split('T')[0],
      notes: 'Aporte de Teste IA (Padrão Ouro) - 20k',
      created_at: new Date().toISOString(),
      user_id: uid
    };

    try {
      await client.execute({
        sql: `INSERT INTO transactions (id, asset_code, type, quantity, price, total_value, date, notes, created_at, user_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          tx.id, tx.asset_code, tx.type, tx.quantity, tx.price, tx.total_value,
          tx.date, tx.notes, tx.created_at, tx.user_id
        ]
      });
      console.log(`✅ Aporte Turso: R$20.000,00 (ITUB4) adicionados para o usuário ID ${uid}`);
    } catch (e) {
      console.error(`❌ Erro no Turso para user ${uid}:`, e.message);
    }

    try {
      localDb.prepare(`
        INSERT OR REPLACE INTO transactions (id, asset_code, type, quantity, price, total_value, date, notes, created_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tx.id, tx.asset_code, tx.type, tx.quantity, tx.price, tx.total_value,
        tx.date, tx.notes, tx.created_at, tx.user_id
      );
      console.log(`✅ Aporte Local: R$20.000,00 (ITUB4) adicionados para o usuário ID ${uid}`);
    } catch (e) {
      console.error(`❌ Erro Local para user ${uid}:`, e.message);
    }
  }

  localDb.close();
  console.log('🎉 Injeção concluída!');
}

inject20k().catch(e => console.error(e));
