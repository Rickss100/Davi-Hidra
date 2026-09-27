const fs = require('fs');

let c = fs.readFileSync('src/components/Strategy/MacroAllocation.jsx', 'utf8');

c = c.replace(
  'const AllocationCard = ({ title, inputs, onChange, orientation }) => {',
  'const AllocationCard = ({ title, inputs, onChange, orientation, expectedTotal = 100 }) => {'
);

c = c.replace(
  'const isValid = total === 100;',
  'const isValid = total === expectedTotal;'
);

c = c.replace(
  '<span>{total}%</span>',
  '<span>{total}% {expectedTotal !== 100 && !isValid ? `(Alvo: ${expectedTotal}%)` : ""}</span>'
);

c = c.replace(
  '<AllocationCard\n        title="Brasil vs EUA"',
  '<AllocationCard\n        expectedTotal={macroAllocation.variable}\n        title="Brasil vs EUA"'
);

c = c.replace(
  '<AllocationCard\n          title="Brasil: AÃ§Ãµes vs FIIs"',
  '<AllocationCard\n          expectedTotal={macroAllocation.brasil}\n          title="Brasil: AÃ§Ãµes vs FIIs"'
);

// If the UTF-8 didn't match:
c = c.replace(
  '<AllocationCard\n          title="Brasil: Ações vs FIIs"',
  '<AllocationCard\n          expectedTotal={macroAllocation.brasil}\n          title="Brasil: Ações vs FIIs"'
);

c = c.replace(
  '<AllocationCard\n          title="EUA: Stocks vs REITs"',
  '<AllocationCard\n          expectedTotal={macroAllocation.usa}\n          title="EUA: Stocks vs REITs"'
);

fs.writeFileSync('src/components/Strategy/MacroAllocation.jsx', c);
console.log('MacroAllocation patched');
