const Database = require('better-sqlite3');
const db = new Database('./investment-data.db');
const holdings = db.prepare(`
  SELECT t.asset_code,
         SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE -t.quantity END) as qty
  FROM transactions t
  WHERE t.user_id = 1
  GROUP BY t.asset_code
  HAVING qty > 0
`).all();
console.log('Holdings for Rickss100:', holdings);
