import { PGlite } from '@electric-sql/pglite';
import bcrypt from 'bcryptjs';

async function main() {
  const p = new PGlite('./.pgdata');
  await p.waitReady;
  const hash = bcrypt.hashSync('Aluno123!', 10);
  await p.query(`
    INSERT INTO users (name, email, password_hash, role, status, plan_period)
    VALUES ('Aluno Investidor (50k)', 'aluno50k@norteinvest.com', $1, 'user', 'active', 'lifetime')
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, status = 'active';
  `, [hash]);
  console.log('✅ Usuário aluno50k@norteinvest.com configurado com sucesso no PGlite!');
  await p.close();
}

main().catch(console.error);
