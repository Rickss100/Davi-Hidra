import fs from 'fs';
import path from 'path';

const files = [
    'src/data/acoes.csv',
    'src/data/fiis.csv'
];

let report = "";

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n').slice(0, 5);
        report += `--- ${file} ---\n`;
        report += lines.join('\n') + '\n\n';
    } catch (err) {
        report += `Error reading ${file}: ${err.message}\n`;
    }
});

fs.writeFileSync('csv_preview.txt', report);
console.log("Written to csv_preview.txt");
