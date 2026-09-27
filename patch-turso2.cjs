const fs = require('fs');

let code = fs.readFileSync('src/services/turso.service.js', 'utf8');

const injection = `
      // ────────────────────────────────────────────────────────────
      // USER OBJECTIVES
      // ────────────────────────────────────────────────────────────
      const tursoObjResult = await client.execute('SELECT * FROM user_objectives');
      const tursoObj = tursoObjResult.rows;

      if (tursoObj.length > 0) {
        console.log(\`☁️ Baixando \${tursoObj.length} objetivos do Turso para o Render/Local...\`);
        const upsertObj = localDb.prepare(\`
          INSERT INTO user_objectives (user_id, macro_allocation, asset_targets, updated_at)
          VALUES (@user_id, @macro_allocation, @asset_targets, @updated_at)
          ON CONFLICT(user_id) DO UPDATE SET
            macro_allocation = excluded.macro_allocation,
            asset_targets = excluded.asset_targets,
            updated_at = excluded.updated_at
        \`);

        for (const row of tursoObj) {
          try {
            upsertObj.run({
              user_id: Number(row.user_id),
              macro_allocation: String(row.macro_allocation),
              asset_targets: String(row.asset_targets),
              updated_at: String(row.updated_at || new Date().toISOString())
            });
          } catch (oErr) {
            console.warn('⚠️ Erro ao restaurar objective do Turso:', oErr.message);
          }
        }
      }
`;

code = code.replace(/\/\/ ─+[\r\n]+\s*\/\/ TRANSAÇÕES/m, injection + '\n      // ────────────────────────────────────────────────────────────\n      // TRANSAÇÕES');

fs.writeFileSync('src/services/turso.service.js', code);
console.log('turso.service.js patched!');
