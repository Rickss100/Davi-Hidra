const db = require('better-sqlite3')('investment-data.db');
console.log(db.prepare("SELECT code FROM assets WHERE type='Renda Fixa' OR code LIKE '%TESOURO%'").all());
