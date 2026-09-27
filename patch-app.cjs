const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

if (!appCode.includes('FloatingChat')) {
  appCode = appCode.replace(
    "import Sidebar from './components/Sidebar/Sidebar';",
    "import Sidebar from './components/Sidebar/Sidebar';\nimport FloatingChat from './components/Chat/FloatingChat';"
  );

  appCode = appCode.replace(
    "</PortfolioProvider>",
    "  <FloatingChat />\n            </PortfolioProvider>"
  );

  fs.writeFileSync('src/App.jsx', appCode);
  console.log('App.jsx patched');
} else {
  console.log('Already patched');
}
