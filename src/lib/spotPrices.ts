export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  timestamp: string;
}

/**
 * Fetches current spot prices for precious metals in CHF per gram
 * Uses hybrid approach:
 * 1. Fetches USD prices per troy ounce from free metals APIs
 * 2. Fetches USD/CHF exchange rate
 * 3. Converts to CHF per gram
 * Prices are cached for 24 hours
 * @returns Spot prices in CHF per gram
 */
export const fetchSpotPrices = async (): Promise<SpotPrices> => {
  try {
    console.log("🔍 Fetching spot prices from API...");
    const response = await fetch('/api/spot-prices');
    console.log("📡 API Response status:", response.status);
    const data = await response.json();
    console.log("💰 Spot Prices received (CHF per gram):", data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching spot prices:', error);
    return {
      gold: 0,
      silver: 0,
      platinum: 0,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Calculates the total bullion value of a coin based on its metal content and current spot prices
 * @param weight - Weight of the coin in grams
 * @param purity - Purity percentage (0-100) or decimal (0-1)
 * @param metal - Metal type (gold, silver, platinum, copper)
 * @param spotPrices - Current spot prices object
 * @returns Total bullion value in CHF
 */
export function calculateBullionValue(
  weight: number,
  purity: number,
  metal: string,
  prices: SpotPrices
): number {
  if (!weight || !purity || !metal || !prices) return 0;
  
  const metalLower = metal.toLowerCase();
  let pricePerGram = 0;
  
  if (metalLower.includes('gold')) {
    pricePerGram = prices.gold;
  } else if (metalLower.includes('silver')) {
    pricePerGram = prices.silver;
  } else if (metalLower.includes('platinum')) {
    pricePerGram = prices.platinum;
  } else {
    return 0;
  }
  
  // Handle both percentage (0-100) and decimal (0-1) purity values
  const normalizedPurity = purity > 1 ? purity / 100 : purity;
  const pureWeight = weight * normalizedPurity;
  return pureWeight * pricePerGram;
}

/**
 * Formats a CHF amount with proper currency symbol and decimal places
 * @param amount - Amount in CHF
 * @returns Formatted string (e.g., "CHF 1,234.56")
 */
function formatCHF(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "CHF 0.00";
  return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const spotPriceService = {
  getSpotPrices: fetchSpotPrices,
  calculateBullionValue,
  formatCHF
};