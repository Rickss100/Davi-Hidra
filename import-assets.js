/**
 * Script para importar todas as ações e FIIs brasileiros do CSV para o banco SQLite
 */

import fs from 'fs';
import csv from 'csv-parser';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar ao banco de dados
const dbPath = path.join(__dirname, 'investment-data.db');
const db = new Database(dbPath);

console.log('🚀 Importando ações e FIIs brasileiros para o banco de dados...\n');

// Função para importar ações
async function importAcoes() {
  const acoesPath = path.join(__dirname, 'src', 'data', 'acoes.csv');
  let imported = 0;
  let skipped = 0;
  
  return new Promise((resolve, reject) => {
    const assets = [];
    let lineCount = 0;
    
    fs.createReadStream(acoesPath, { encoding: 'latin1' })
      .pipe(csv({ separator: ';', skipLines: 1 })) // Pular a primeira linha "Resultado da busca"
      .on('data', (row) => {
        lineCount++;
        // Pegar o código da ação (coluna "Papel")
        const code = row['Papel'];
        
        // Ignorar header e linhas vazias
        if (code && code.trim() !== '' && code !== 'Papel' && lineCount > 0) {
          assets.push({
            code: code.trim(),
            name: code.trim(), // Usar o código como nome por enquanto
            type: 'Acao',
            market: 'BR'
          });
        }
      })
      .on('end', () => {
        console.log(`📊 Total de ações encontradas: ${assets.length}`);
        
        // Preparar statement para insert
        const insertStmt = db.prepare(`
          INSERT OR IGNORE INTO assets (code, name, type, market)
          VALUES (@code, @name, @type, @market)
        `);
        
        // Importar em batch
        const insertMany = db.transaction((assetsToInsert) => {
          for (const asset of assetsToInsert) {
            const result = insertStmt.run(asset);
            if (result.changes > 0) {
              imported++;
            } else {
              skipped++;
            }
          }
        });
        
        insertMany(assets);
        
        console.log(`✅ Ações importadas: ${imported}`);
        if (skipped > 0) console.log(`⏭️  Ações já existentes (ignoradas): ${skipped}`);
        
        resolve({ imported, skipped, total: assets.length });
      })
      .on('error', reject);
  });
}

// Função para importar FIIs
async function importFIIs() {
  const fiisPath = path.join(__dirname, 'src', 'data', 'fiis.csv');
  let imported = 0;
  let skipped = 0;
  
  return new Promise((resolve, reject) => {
    const assets = [];
    let lineCount = 0;
    let headerFound = false;
    
    fs.createReadStream(fiisPath, { encoding: 'latin1' })
      .pipe(csv({ separator: ';', skipLines: 1 })) // Pular primeira linha como nas ações
      .on('data', (row) => {
        lineCount++;
        
        // Tentar diferentes possíveis nomes de coluna
        const code = row['Código'] || row['Codigo'] || row['Papel'] || row['CÓDIGO'] || row['CODIGO'] || row['PAPEL'];
        
        if (!headerFound && lineCount === 1) {
          console.log('\n📋 Colunas encontradas no CSV de FIIs:', Object.keys(row).slice(0, 10).join(', '));
          headerFound = true;
        }
        
        // Ignorar header e linhas vazias
        if (code && code.trim() !== '' && 
            code !== 'Código' && code !== 'Codigo' && code !== 'Papel' && 
            code !== 'CÓDIGO' && code !== 'CODIGO' && code !== 'PAPEL') {
          assets.push({
            code: code.trim(),
            name: code.trim(),
            type: 'FII',
            market: 'BR'
          });
        }
      })
      .on('end', () => {
        console.log(`\n📊 Total de FIIs encontrados: ${assets.length}`);
        
        if (assets.length === 0) {
          console.log('⚠️  Nenhum FII encontrado. Verifique o formato do CSV.');
          resolve({ imported: 0, skipped: 0, total: 0 });
          return;
        }
        
        const insertStmt = db.prepare(`
          INSERT OR IGNORE INTO assets (code, name, type, market)
          VALUES (@code, @name, @type, @market)
        `);
        
        const insertMany = db.transaction((assetsToInsert) => {
          for (const asset of assetsToInsert) {
            const result = insertStmt.run(asset);
            if (result.changes > 0) {
              imported++;
            } else {
              skipped++;
            }
          }
        });
        
        insertMany(assets);
        
        console.log(`✅ FIIs importados: ${imported}`);
        if (skipped > 0) console.log(`⏭️  FIIs já existentes (ignorados): ${skipped}`);
        
        resolve({ imported, skipped, total: assets.length });
      })
      .on('error', reject);
  });
}

// Executar importação
try {
  const acoesResult = await importAcoes();
  const fiisResult = await importFIIs();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 IMPORTAÇÃO CONCLUÍDA!');
  console.log('='.repeat(50));
  console.log(`Total de Ações: ${acoesResult.total} (${acoesResult.imported} novas)`);
  console.log(`Total de FIIs: ${fiisResult.total} (${fiisResult.imported} novos)`);
  console.log(`\n📈 Total geral no banco: ${acoesResult.imported + fiisResult.imported + acoesResult.skipped + fiisResult.skipped} ativos`);
  
  db.close();
} catch (error) {
  console.error('❌ Erro na importação:', error);
  db.close();
  process.exit(1);
}
