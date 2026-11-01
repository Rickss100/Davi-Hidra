import postgres from 'postgres';

async function testConn() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ Erro: DATABASE_URL não definida.');
    process.exit(1);
  }
  console.log('Testing connection to DATABASE_URL...');
  try {
    const sql = postgres(url, { connect_timeout: 10, ssl: 'require' });
    const res = await sql`SELECT version(), current_database(), current_user`;
    console.log('✓ Connection OK:', res[0]);
    await sql.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
}

testConn();
