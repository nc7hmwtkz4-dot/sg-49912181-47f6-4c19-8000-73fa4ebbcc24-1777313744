const fs = require('fs');
let ts = fs.readFileSync('src/types/coin.ts', 'utf-8');

if (!ts.includes('shippingCost')) {
  ts = ts.replace(/profit\?: number;/, 'profit?: number;\n  shippingCost?: number;\n  platformFees?: number;');
}
if (!ts.includes('platform?: string;')) {
  ts = ts.replace(/email: string;/, 'email: string;\n  platform?: string;');
}

fs.writeFileSync('src/types/coin.ts', ts);
console.log("Types updated.");
