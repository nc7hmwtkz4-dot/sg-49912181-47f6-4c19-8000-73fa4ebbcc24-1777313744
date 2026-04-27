const fs = require('fs');

// 1. Fix SaleCheckoutModal.tsx
let checkout = fs.readFileSync('src/components/coin/SaleCheckoutModal.tsx', 'utf8');
checkout = checkout.replace(/CoinWithReference/g, 'Coin');
checkout = checkout.replace(/coin\.coins_reference\?\.metal/g, 'coin.metal');
fs.writeFileSync('src/components/coin/SaleCheckoutModal.tsx', checkout);

// 2. Fix GroupedCoinTable.tsx
let table = fs.readFileSync('src/components/coin/GroupedCoinTable.tsx', 'utf8');
if (!table.includes('onSellCoin?: (coin: Coin) => void;')) {
    table = table.replace('calculateBullionValue: (coin: Coin) => number;', 'calculateBullionValue: (coin: Coin) => number;\n  onSellCoin?: (coin: Coin) => void;');
}
if (!table.includes('onSellCoin\n}: GroupedCoinTableProps) {') && !table.includes('onSellCoin }: GroupedCoinTableProps) {')) {
    table = table.replace('calculateBullionValue\n}: GroupedCoinTableProps) {', 'calculateBullionValue,\n  onSellCoin\n}: GroupedCoinTableProps) {');
}
table = table.replace(/onClick=\{\(\) => onRecordSale\(coin\.id\)\}/g, 'onClick={() => onSellCoin ? onSellCoin(coin) : onRecordSale(coin.id)}');
fs.writeFileSync('src/components/coin/GroupedCoinTable.tsx', table);

// 3. Fix collection.tsx
let col = fs.readFileSync('src/pages/collection.tsx', 'utf8');

if (!col.includes('CoinSearchModal')) {
    col = col.replace('import { GroupedCoinTable } from "@/components/coin/GroupedCoinTable";', 'import { GroupedCoinTable } from "@/components/coin/GroupedCoinTable";\nimport { CoinSearchModal } from "@/components/coin/CoinSearchModal";\nimport { SaleCheckoutModal } from "@/components/coin/SaleCheckoutModal";\nimport { Search } from "lucide-react";');
}

if (!col.includes('searchModalOpen')) {
    col = col.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [searchModalOpen, setSearchModalOpen] = useState(false);\n  const [saleModalOpen, setSaleModalOpen] = useState(false);\n  const [selectedCoinForSale, setSelectedCoinForSale] = useState<any>(null);');
}

if (!col.includes('handleSellCoin')) {
    col = col.replace('const loadCoins = async () => {', 'const handleSellCoin = (coin: any) => {\n    setSelectedCoinForSale(coin);\n    setSaleModalOpen(true);\n  };\n\n  const handleSaleCompleted = () => {\n    loadCoins();\n    toast({\n      title: "Vente enregistrée",\n      description: "La pièce a été marquée comme vendue"\n    });\n  };\n\n  const loadCoins = async () => {');
}

if (!col.includes('setSearchModalOpen(true)')) {
    col = col.replace('<Button onClick={() => router.push("/coin/new")}>', '<Button onClick={() => setSearchModalOpen(true)} variant="outline" className="mr-2">\n              <Search className="h-4 w-4 mr-2" />\n              Rechercher une pièce\n            </Button>\n            <Button onClick={() => router.push("/coin/new")}>');
}

if (!col.includes('onSellCoin={handleSellCoin}')) {
    col = col.replace('calculateBullionValue={calculateBullionValue}', 'calculateBullionValue={calculateBullionValue}\n              onSellCoin={handleSellCoin}');
}

if (!col.includes('<CoinSearchModal')) {
    col = col.replace('</Layout>', `  <CoinSearchModal 
          open={searchModalOpen} 
          onOpenChange={setSearchModalOpen}
          onCoinSelected={(coin: any) => {
            router.push(\`/coin/new?ref=\${coin.id}\`);
          }}
        />

        <SaleCheckoutModal
          open={saleModalOpen}
          onOpenChange={setSaleModalOpen}
          coin={selectedCoinForSale}
          onSaleCompleted={handleSaleCompleted}
        />
    </Layout>`);
}

fs.writeFileSync('src/pages/collection.tsx', col);
console.log("Fixed files successfully");
