const fs = require('fs');
const { execSync } = require('child_process');

console.log("Restoring files from git...");
execSync('git checkout HEAD -- src/pages/collection.tsx src/components/coin/GroupedCoinTable.tsx');

console.log("Patching collection.tsx...");
let col = fs.readFileSync('src/pages/collection.tsx', 'utf8');

// Replace old types
col = col.replace(/CoinWithReference/g, 'Coin');

// Add Imports
if (!col.includes('SaleCheckoutModal')) {
  col = col.replace(
    /import \{ SEO \} from "@\/components\/SEO";/,
    'import { SEO } from "@/components/SEO";\nimport { SaleCheckoutModal } from "@/components/coin/SaleCheckoutModal";\nimport { CoinSearchModal } from "@/components/coin/CoinSearchModal";\nimport { Search } from "lucide-react";'
  );
}

// Add States
if (!col.includes('saleModalOpen')) {
  col = col.replace(
    /export default function Collection\(\) \{/,
    'export default function Collection() {\n  const [searchModalOpen, setSearchModalOpen] = useState(false);\n  const [saleModalOpen, setSaleModalOpen] = useState(false);\n  const [selectedCoinForSale, setSelectedCoinForSale] = useState<any>(null);\n  const handleSellCoin = (coin: any) => {\n    setSelectedCoinForSale(coin);\n    setSaleModalOpen(true);\n  };\n'
  );
}

// Add Search Button
if (!col.includes('setSearchModalOpen(true)')) {
  col = col.replace(
    /<Button onClick=\{.*\/coin\/new.*\}\s*>/,
    '<Button onClick={() => setSearchModalOpen(true)} variant="outline" className="mr-2"><Search className="w-4 h-4 mr-2"/>Rechercher</Button>\n            $&'
  );
}

// Add onSellCoin prop
col = col.replace(
  /<GroupedCoinTable/g,
  '<GroupedCoinTable onSellCoin={handleSellCoin}'
);

// Add Modals at bottom
if (!col.includes('<CoinSearchModal')) {
  col = col.replace(
    /<\/Layout>/,
    `  <CoinSearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} onCoinSelected={(coin: any) => router.push(\`/coin/new?ref=\${coin.id}\`)} />\n        <SaleCheckoutModal open={saleModalOpen} onOpenChange={setSaleModalOpen} coin={selectedCoinForSale} onSaleCompleted={() => window.location.reload()} />\n      </Layout>`
  );
}
fs.writeFileSync('src/pages/collection.tsx', col);

console.log("Patching GroupedCoinTable.tsx...");
let table = fs.readFileSync('src/components/coin/GroupedCoinTable.tsx', 'utf8');

// Clean old types
table = table.replace(/CoinWithReference/g, 'Coin');

if (!table.includes('onSellCoin?: (coin: Coin) => void;')) {
  table = table.replace(
    /calculateBullionValue: \(coin: Coin\) => number;/,
    'calculateBullionValue: (coin: Coin) => number;\n  onSellCoin?: (coin: Coin) => void;'
  );
}

table = table.replace(/calculateBullionValue\n\}: GroupedCoinTableProps/, 'calculateBullionValue,\n  onSellCoin\n}: GroupedCoinTableProps');
table = table.replace(/calculateBullionValue \}: GroupedCoinTableProps/, 'calculateBullionValue, onSellCoin }: GroupedCoinTableProps');

table = table.replace(
  /onClick=\{\(\) => onRecordSale\(coin\.id\)\}/g,
  'onClick={() => onSellCoin ? onSellCoin(coin) : onRecordSale(coin.id)}'
);
fs.writeFileSync('src/components/coin/GroupedCoinTable.tsx', table);

console.log("Patching SaleCheckoutModal.tsx...");
try {
    let checkout = fs.readFileSync('src/components/coin/SaleCheckoutModal.tsx', 'utf8');
    checkout = checkout.replace(/CoinWithReference/g, 'Coin');
    checkout = checkout.replace(/coin\.coins_reference\?\.metal/g, 'coin.metal');
    fs.writeFileSync('src/components/coin/SaleCheckoutModal.tsx', checkout);
} catch(e) {
    console.log("SaleCheckoutModal error, skipping.");
}

console.log("Done.");
