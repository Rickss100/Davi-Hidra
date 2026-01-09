import Database from 'better-sqlite3';

console.log('Starting simple DB test...');

try {
  const db = new Database('test.db');
  console.log('✅ Database created successfully!');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS test (
      id INTEGER PRIMARY KEY,
      name TEXT
    )
  `);
  console.log('✅ Table created successfully!');
  
  const insert = db.prepare('INSERT INTO test (name) VALUES (?)');
  insert.run('Hello World');
  console.log('✅ Data inserted successfully!');
  
  const rows = db.prepare('SELECT * FROM test').all();
  console.log('✅ Data retrieved:', rows);
  
  db.close();
  console.log('✅ Test completed successfully!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
