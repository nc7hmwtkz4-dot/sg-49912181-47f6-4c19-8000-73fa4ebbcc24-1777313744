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

  addSale: (sale: Sale): void => {
    const sales = storageService.getSales();
    sales.push(sale);
    storageService.saveSales(sales);
  },

  generateId: (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  generateSKU: (countryCode: string, kmNumber: string): string => {
    // Remove any non-alphanumeric characters from KM number
    const cleanKM = kmNumber.replace(/[^0-9a-zA-Z]/g, '');
    return `${countryCode.toUpperCase()}-KM${cleanKM}`;
  }
};