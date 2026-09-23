import Database from 'better-sqlite3';
import path from 'path';

function updateDb(dbPath) {
  console.log('Atualizando banco em:', dbPath);
  const db = new Database(dbPath);

  // Verificar se coluna user_id existe
  const transCols = db.pragma('table_info(transactions)');
  if (!transCols.some(c => c.name === 'user_id')) {
    db.exec('ALTER TABLE transactions ADD COLUMN user_id INTEGER DEFAULT 1');
  }

  // Atualizar ou inserir user 7 como Ricardo Arthur
  const user7 = db.prepare('SELECT * FROM users WHERE id = 7').get();
  if (user7) {
    db.prepare(`
      UPDATE users 
      SET name = 'Ricardo Arthur', email = 'ricardo', password = '123', role = 'user', status = 'active' 
      WHERE id = 7
    `).run();
  } else {
    db.prepare(`
      INSERT INTO users (id, name, email, password, role, status) 
      VALUES (7, 'Ricardo Arthur', 'ricardo', '123', 'user', 'active')
    `).run();
  }

  // Deletar transações antigas do user 7 se houver
  db.prepare('DELETE FROM transactions WHERE user_id = 7').run();

  // Inserir as 2 transações comprovadas
  db.prepare(`
    INSERT INTO transactions (asset_code, type, quantity, price, total_value, date, notes, user_id) 
    VALUES ('TAEE4', 'buy', 2, 25.00, 50.00, '2026-09-23', 'Aporte Ações', 7)
  `).run();

  db.prepare(`
    INSERT INTO transactions (asset_code, type, quantity, price, total_value, date, notes, user_id) 
    VALUES ('TESOURO_SELIC_2029', 'buy', 1, 5000.00, 5000.00, '2026-09-23', 'Reserva de Emergência', 7)
  `).run();

  const statsUsers = db.prepare('SELECT COUNT(*) as total FROM users').get();
  const statsTrans = db.prepare('SELECT COUNT(*) as total, SUM(total_value) as volume FROM transactions').get();
  console.log(`Banco ${path.basename(dbPath)}: Total usuários = ${statsUsers.total}, Total transações = ${statsTrans.total}, Volume total = R$ ${Number(statsTrans.volume).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  db.close();
}

updateDb(path.join(process.cwd(), 'investment-data.db'));
updateDb(path.join(process.cwd(), 'src/db/seed-investment-data.db'));
