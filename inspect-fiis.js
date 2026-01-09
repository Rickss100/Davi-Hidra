import fs from 'fs';

// Ler as primeiras 10 linhas do arquivo para ver a estrutura
const lines = fs.readFileSync('./src/data/fiis.csv', 'latin1').split('\n').slice(0, 10);

console.log('Primeiras 10 linhas do arquivo fiis.csv:\n');
lines.forEach((line, i) => {
  console.log(`Linha ${i + 1}: ${line.substring(0, 200)}`);
});
