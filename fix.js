const fs = require('fs');

let coinTs = fs.readFileSync('src/types/coin.ts', 'utf8');
coinTs = coinTs.replace('id: string;', 'id: string;\n  referenceCoinId?: string;');
fs.writeFileSync('src/types/coin.ts', coinTs);

let skuTs = fs.readFileSync('src/pages/coin/[sku].tsx', 'utf8');
skuTs = skuTs.replace('id: c.id,', 'id: c.id,\n        referenceCoinId: c.reference_coin_id,');
skuTs = skuTs.replace('kmNumber: c.km_number,', 'kmNumber: c.coins_reference?.km_number || "",');
skuTs = skuTs.replace('metal: c.metal as', 'metal: (c.coins_reference?.metal || "other") as');
skuTs = skuTs.replace('purity: c.purity,', 'purity: c.coins_reference?.purity || 0,');
skuTs = skuTs.replace('weight: c.weight,', 'weight: c.coins_reference?.weight || 0,');
skuTs = skuTs.replace(/km_number: editingCoin\.kmNumber,\s*metal: editingCoin\.metal,\s*purity: editingCoin\.purity,\s*weight: editingCoin\.weight,/g, '');
skuTs = skuTs.replace(/km_number: referenceCoin\.kmNumber,\s*metal: referenceCoin\.metal,\s*purity: referenceCoin\.purity,\s*weight: referenceCoin\.weight,/g, 'reference_coin_id: referenceCoin.referenceCoinId!,');
fs.writeFileSync('src/pages/coin/[sku].tsx', skuTs);

let collTs = fs.readFileSync('src/pages/collection.tsx', 'utf8');
collTs = collTs.replace('id: coin.id,', 'id: coin.id,\n        referenceCoinId: coin.reference_coin_id,');
collTs = collTs.replace('kmNumber: coin.km_number,', 'kmNumber: coin.coins_reference?.km_number || "",');
collTs = collTs.replace('metal: coin.metal as', 'metal: (coin.coins_reference?.metal || "other") as');
collTs = collTs.replace('purity: coin.purity,', 'purity: coin.coins_reference?.purity || 0,');
collTs = collTs.replace('weight: coin.weight,', 'weight: coin.coins_reference?.weight || 0,');
collTs = collTs.replace(/km_number: registerFormData\.kmNumber,\s*metal: registerFormData\.metal,\s*purity: registerFormData\.purity,\s*weight: registerFormData\.weight,/g, 'reference_coin_id: selectedReference.id,');
fs.writeFileSync('src/pages/collection.tsx', collTs);

let dashTs = fs.readFileSync('src/pages/dashboard.tsx', 'utf8');
dashTs = dashTs.replace(/const metal = coin\.metal \|\| "Unknown";/g, 'const metal = coin.coins_reference?.metal || "Unknown";');
dashTs = dashTs.replace(/if \(coin\.metal && coin\.weight && coin\.purity\) \{/g, 'if (coin.coins_reference?.metal && coin.coins_reference?.weight && coin.coins_reference?.purity) {');
dashTs = dashTs.replace(/coin\.weight,/g, 'coin.coins_reference.weight,');
dashTs = dashTs.replace(/coin\.purity,/g, 'coin.coins_reference.purity,');
dashTs = dashTs.replace(/coin\.metal,/g, 'coin.coins_reference.metal,');
fs.writeFileSync('src/pages/dashboard.tsx', dashTs);

let salesTs = fs.readFileSync('src/pages/sales.tsx', 'utf8');
salesTs = salesTs.replace('id: c.id,', 'id: c.id,\n          referenceCoinId: c.reference_coin_id,');
salesTs = salesTs.replace('kmNumber: c.km_number,', 'kmNumber: c.coins_reference?.km_number || "",');
salesTs = salesTs.replace('metal: c.metal as', 'metal: (c.coins_reference?.metal || "other") as');
salesTs = salesTs.replace('purity: c.purity,', 'purity: c.coins_reference?.purity || 0,');
salesTs = salesTs.replace('weight: c.weight,', 'weight: c.coins_reference?.weight || 0,');
fs.writeFileSync('src/pages/sales.tsx', salesTs);
