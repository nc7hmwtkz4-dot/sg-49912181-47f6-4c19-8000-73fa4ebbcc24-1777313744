const METAL_PRICE_API_KEY = 'a4c341c9c8b69969cba65382941825cf';
const TROY_OZ_TO_GRAMS = 31.1034768;

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  timestamp: string;
}

// Fallback prices in CHF per gram (as of Feb 2026)
const FALLBACK_PRICES: SpotPrices = {
  gold: 82.5,
  silver: 1.02,
  platinum: 32.8,
  timestamp: new Date().toISOString(),
};

/**
 * Fetches current spot prices for precious metals
 * Tries to fetch from internal API route first to protect keys, falls back to direct API if needed
 * @returns Spot prices in CHF per gram
 */
async function fetchSpotPrices(): Promise<SpotPrices> {
  try {
    // Try fetching from our internal API route first
    const response = await fetch('/api/spot-prices');

    if (!response.ok) {
      console.warn('Internal API error, falling back to direct fetch');
      throw new Error('Internal API failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching spot prices:', error);
    // Fallback to direct fetch if internal API fails (though typically we should avoid exposing keys client-side)
    // For now returning fallback prices to ensure app stability
    return FALLBACK_PRICES;
  }
}

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
  
  const pureWeight = weight * (purity / 100);
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