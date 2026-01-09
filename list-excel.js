import fs from 'fs';
import path from 'path';

const dirPath = 'C:\\Users\\ricks\\Projeto de Estudo Programaçao\\Planilha';
const outputPath = 'files.txt';

try {
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        fs.writeFileSync(outputPath, "Files found:\n" + files.join('\n'));
        console.log("Written to files.txt");
    } else {
        fs.writeFileSync(outputPath, "Directory does not exist: " + dirPath);
        console.log("Directory not found");
    }
} catch (err) {
    fs.writeFileSync(outputPath, "Error: " + err.message);
    console.error(err);
}
