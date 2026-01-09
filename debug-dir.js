import fs from 'fs';
import path from 'path';

const dirsToCheck = [
    'C:\\Users\\ricks\\Projeto de Estudo Programaçao\\Planilha',
    'C:\\Users\\ricks\\Projeto de Estudo Programaçao'
];
const logFile = 'dir-debug.txt';

let report = "";

dirsToCheck.forEach(dir => {
    report += `\n--- Contents of ${dir} ---\n`;
    try {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            if (files.length === 0) report += "(Empty directory)\n";
            files.forEach(f => {
                report += `[File] ${f}\n`;
            });
        } else {
            report += "(Directory not found)\n";
        }
    } catch (err) {
        report += `Error accessing dir: ${err.message}\n`;
    }
});

fs.writeFileSync(logFile, report);
console.log("Written to " + logFile);
