import fs from 'fs';
import csv from 'csv-parser';

const fiisPath = './src/data/fiis.csv';

console.log('Testando leitura de FIIs...\n');

let count = 0;
const fiis = [];

fs.createReadStream(fiisPath, { encoding: 'latin1' })
  .pipe(csv({ separator: ';', skipLines: 1 }))
  .on('data', (row) => {
    count++;
    if (count <= 5) {
      console.log(`Linha ${count}:`, JSON.stringify(row, null, 2));
      fiis.push(row);
    }
  })
  .on('end', () => {
    console.log(`\nTotal de linhas lidas: ${count}`);
    console.log(`\nColunas disponíveis na primeira linha:`, Object.keys(fiis[0] || {}));
  });
