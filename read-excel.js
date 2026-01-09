import XLSX from 'xlsx';
import fs from 'fs';

const basePath = 'C:\\Users\\ricks\\Projeto de Estudo Programaçao\\Planilha\\Planilha DAVI';
const extensions = ['.xlsx', '.xls'];
const output = 'excel-info.txt';

let found = false;

try {
    for (const ext of extensions) {
        const fullPath = basePath + ext;
        if (fs.existsSync(fullPath)) {
            const workbook = XLSX.readFile(fullPath);
            const sheetNames = workbook.SheetNames;
            fs.writeFileSync(output, `File found: ${fullPath}\nSheets: ${sheetNames.join(', ')}`);
            found = true;
            break;
        }
    }
    
    if (!found) {
        fs.writeFileSync(output, "No Excel file found with name 'Planilha DAVI' in target directory.");
    }

} catch (err) {
    fs.writeFileSync(output, "Error reading Excel: " + err.message);
}
