import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Configurations
const EXCEL_DIR = 'C:\\Users\\ricks\\Projeto de Estudo Programaçao\\Planilha';
const EXCEL_NAME = 'Planilha DAVI'; 
const OUTPUT_FILE = 'C:\\Users\\ricks\\Projeto de Estudo Programaçao\\hello-world\\src\\data\\assets.json';
const LOG_FILE = 'C:\\Users\\ricks\\Projeto de Estudo Programaçao\\hello-world\\sync-log.txt';

const EXTENSIONS = ['.xlsx', '.xls'];

const SHEET_MAPPING = {
    'fundamentusAçoes': 'acoes',
    'fundamentusFIIs': 'fiis'
};

function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line);
    console.log(msg);
}

function findExcelFile() {
    for (const ext of EXTENSIONS) {
        const fullPath = path.join(EXCEL_DIR, EXCEL_NAME + ext);
        if (fs.existsSync(fullPath)) return fullPath;
    }
    return null;
}

function processSheet(sheet) {
    // header: 1 returns array of arrays [ ['Ticker', 'Name', ...], ['PETR4', ...], ... ]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length < 2) return [];

    const assets = [];
    const tickerRegex = /^[A-Z0-9]{4,6}(3|4|5|6|11|32|33|34|35)?$/; // More permissive regex

    // Iterate all rows, starting from index 1 (skipping potential header)
    // We will scan the first few columns for something that looks like a ticker
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // Check first column for ticker
        let ticker = row[0];
        
        if (typeof ticker === 'string') {
            ticker = ticker.trim().toUpperCase();
            // Basic validation: Length 4-7, alphanumeric
            if (ticker.length >= 4 && ticker.length <= 10) {
                 // Try to get name from col 1, or use ticker
                 let name = row[1];
                 if (typeof name !== 'string') name = ticker;

                 assets.push({
                     ticker: ticker,
                     name: name.trim(),
                     type: 'UNKNOWN' // Will be assigned by category later
                 });
            }
        }
    }
    
    // Sort alphabetically
    return assets.sort((a, b) => a.ticker.localeCompare(b.ticker));
}

function run() {
    // Clear log
    fs.writeFileSync(LOG_FILE, "Starting Sync...\n");

    try {
        const excelPath = findExcelFile();
        
        if (!excelPath) {
            log(`ERROR: Excel file '${EXCEL_NAME}' not found in ${EXCEL_DIR}`);
            return;
        }

        log(`Reading file: ${excelPath}`);
        const workbook = XLSX.readFile(excelPath);
        const result = {
            updatedAt: new Date().toISOString(),
            source: excelPath,
            acoes: [],
            fiis: []
        };

        Object.keys(SHEET_MAPPING).forEach(sheetName => {
            const category = SHEET_MAPPING[sheetName];
            const sheet = workbook.Sheets[sheetName];
            
            if (sheet) {
                log(`Processing sheet: ${sheetName} -> ${category}`);
                const items = processSheet(sheet);
                log(`Found ${items.length} items in ${sheetName}`);
                result[category] = items;
            } else {
                log(`WARNING: Sheet '${sheetName}' not found in workbook.`);
                log(`Available sheets: ${workbook.SheetNames.join(', ')}`);
            }
        });

        log(`Saving to ${OUTPUT_FILE}`);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
        log("Sync Complete.");

    } catch (err) {
        log(`CRITICAL ERROR: ${err.message}`);
        log(err.stack);
    }
}

run();
