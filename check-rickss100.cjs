const Database = require('better-sqlite3');
const db = new Database('./investment-data.db');
const user = db.prepare('SELECT id, name, email FROM users WHERE email LIKE ? OR name LIKE ?').get('%rickss100%', '%rickss100%');
console.log('User:', user);

if (user) {
  const holdings = db.prepare(`
    SELECT t.asset_code, a.category,
           SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE -t.quantity END) as qty
    FROM transactions t
    LEFT JOIN assets a ON a.code = t.asset_code
    WHERE t.user_id = ?
    GROUP BY t.asset_code
    HAVING qty > 0
  `).all(user.id);
  console.log('Holdings:', holdings);
}
