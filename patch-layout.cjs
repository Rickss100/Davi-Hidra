const fs = require('fs');

let css = fs.readFileSync('src/components/Strategy/Strategy.css', 'utf8');
css = css.replace('.assets-container {', '.assets-container {\n  /* Removed in favor of explicit rows */\n}\n\n.assets-row-3 {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1rem;\n  padding-bottom: 1rem;\n}\n\n.assets-row-2 {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 1rem;\n  padding-bottom: 2rem;\n  width: 66.66%;\n}\n\n.old-assets-container {');
fs.writeFileSync('src/components/Strategy/Strategy.css', css);

let jsx = fs.readFileSync('src/pages/DefinirObjetivos.jsx', 'utf8');
jsx = jsx.replace('<div className="assets-container">', '<div className="assets-row-3">');

const searchTarget = `            <AssetTargetTable availableAssets={allAssetsInfo} 
              title="REITs"`;
const replacement = `          </div>
          <div className="assets-row-2">
            <AssetTargetTable availableAssets={allAssetsInfo} 
              title="REITs"`;

jsx = jsx.replace(searchTarget, replacement);
fs.writeFileSync('src/pages/DefinirObjetivos.jsx', jsx);

console.log('Arquivos atualizados!');
