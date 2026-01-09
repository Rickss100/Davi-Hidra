import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'C:\\Users\\ricks\\Projeto de Estudo Programaçao\\Planilha\\Planilha DAVI.xlsx';
const output = 'excel-headers.txt';

try {
    if (fs.existsSync(filePath)) {
        const workbook = XLSX.readFile(filePath);
        
        let report = "";
        
        ['fundamentusAçoes', 'fundamentusFIIs'].forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            if (sheet) {
                // Convert sheet to JSON (array of arrays) to get headers easily
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                if (data && data.length > 0) {
                    report += `=== ${sheetName} Headers ===\n`;
                    report += data[0].join(' | ') + '\n\n';
                    // Also print first row of data to see example values
                    if (data.length > 1) {
                         report += `=== ${sheetName} Row 1 Data ===\n`;
                         report += data[1].join(' | ') + '\n\n';
                    }
                } else {
                    report += `=== ${sheetName} is empty ===\n\n`;
                }
            } else {
                report += `=== ${sheetName} NOT FOUND ===\nAvailable sheets: ${workbook.SheetNames.join(', ')}\n\n`;
            }
        });

        fs.writeFileSync(output, report);
        console.log("Headers written to " + output);
    } else {
        fs.writeFileSync(output, "File not found: " + filePath);
    }
} catch (err) {
    fs.writeFileSync(output, "Error: " + err.message);
}
