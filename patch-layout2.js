import fs from 'fs';

let jsx = fs.readFileSync('src/pages/DefinirObjetivos.jsx', 'utf8');

// The file currently has <div className="assets-row-3"> followed by 5 tables.
// We want to insert the closing div and new div right before the REITs table.

const searchRegex = /<AssetTargetTable availableAssets=\{allAssetsInfo\}\s*title="REITs"/g;
jsx = jsx.replace(searchRegex, `</div>\n        <div className="assets-row-2">\n          <AssetTargetTable availableAssets={allAssetsInfo} \n            title="REITs"`);

fs.writeFileSync('src/pages/DefinirObjetivos.jsx', jsx);
console.log('Fixed DefinirObjetivos layout!');
