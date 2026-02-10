import { Coin, Sale } from "@/types/coin";

const COINS_STORAGE_KEY = "numivault_coins";
const SALES_STORAGE_KEY = "numivault_sales";

export const storageService = {
  getCoins: (): Coin[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(COINS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveCoins: (coins: Coin[]): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(COINS_STORAGE_KEY, JSON.stringify(coins));
  },

  addCoin: (coin: Coin): void => {
    const coins = storageService.getCoins();
    coins.push(coin);
    storageService.saveCoins(coins);
  },

  updateCoin: (coinId: string, updates: Partial<Coin>): void => {
    const coins = storageService.getCoins();
    const index = coins.findIndex(c => c.id === coinId);
    if (index !== -1) {
      coins[index] = { ...coins[index], ...updates };
      storageService.saveCoins(coins);
    }
  },

  deleteCoin: (coinId: string): void => {
    const coins = storageService.getCoins();
    const filtered = coins.filter(c => c.id !== coinId);
    storageService.saveCoins(filtered);
  },

  getSales: (): Sale[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(SALES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSales: (sales: Sale[]): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
  },

  addSale: (sale: Omit<Sale, "id">) => {
    const sales = storageService.getSales();
    const newSale: Sale = {
      ...sale,
      id: storageService.generateId(),
      sku: sale.sku || "",
      coinName: sale.coinName || "",
      purchasePrice: sale.purchasePrice || 0,
      profit: sale.profit || 0
    };
    sales.push(newSale);
    if (typeof window !== "undefined") {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    }
    return newSale;
  },

  markCoinAsSold: (
    coinId: string,
    saleDate: string,
    salePrice: number,
    buyerInfo?: string,
    notes?: string
  ): void => {
    const coins = storageService.getCoins();
    const coin = coins.find(c => c.id === coinId);

    // Create sale record
    storageService.addSale({
      coinId,
      saleDate,
      salePrice,
      buyerInfo: buyerInfo || "",
      notes: notes || "",
      sku: coin?.sku || "",
      coinName: coin?.coinName || "",
      purchasePrice: coin?.purchasePrice || 0,
      profit: coin ? (salePrice - coin.purchasePrice) : 0
    });

    // Mark coin as sold
    const index = coins.findIndex(c => c.id === coinId);
    if (index !== -1) {
      coins[index] = { ...coins[index], isSold: true };
      storageService.saveCoins(coins);
    }
  },

  generateId: (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  generateSKU: (countryCode: string, kmNumber: string): string => {
    // Remove any non-numeric characters except decimals from KM number
    const cleanKM = kmNumber.replace(/[^0-9.]/g, '');
    return `${countryCode.toUpperCase()}-KM${cleanKM}`;
  }
};