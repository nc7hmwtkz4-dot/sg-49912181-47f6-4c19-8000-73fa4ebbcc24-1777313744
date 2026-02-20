const METAL_PRICE_API_KEY = 'a4c341c9c8b69969cba65382941825cf';
const TROY_OZ_TO_GRAMS = 31.1034768;

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
}

// Fallback prices in CHF per gram
const FALLBACK_PRICES: SpotPrices = {
  gold: 75.5,
  silver: 0.89,
  platinum: 28.5,
};

export async function fetchSpotPrices(): Promise<SpotPrices | null> {
  try {
    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${METAL_PRICE_API_KEY}&base=CHF&currencies=XAU,XAG,XPT`
    );

    if (!response.ok) {
      console.error('Metal Price API error:', response.statusText);
      return FALLBACK_PRICES;
    }

    const data = await response.json();

    console.log('Metal Price API Response:', JSON.stringify(data, null, 2));

    if (!data.rates) {
      console.error('Invalid API response format');
      return FALLBACK_PRICES;
    }

    // API returns rates like XAU: 0.000261 (meaning 1 CHF = 0.000261 troy oz)
    // We need: 1 troy oz = X CHF, then convert to grams
    // Step 1: Invert the rate to get CHF per troy oz
    // Step 2: Divide by troy oz to grams constant to get CHF per gram
    const prices: SpotPrices = {
      gold: data.rates.XAU ? (1 / data.rates.XAU) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.gold,
      silver: data.rates.XAG ? (1 / data.rates.XAG) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.silver,
      platinum: data.rates.XPT ? (1 / data.rates.XPT) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.platinum,
    };

    console.log('Calculated prices per gram:', prices);

    return prices;
  } catch (error) {
    console.error('Error fetching spot prices:', error);
    return FALLBACK_PRICES;
  }
}

export function calculateMetalValue(
  weight: number,
  purity: number,
  metal: 'gold' | 'silver' | 'platinum',
  spotPrices: SpotPrices | null
): number {
  if (!spotPrices) return 0;
  
  const pricePerGram = spotPrices[metal];
  const pureWeight = (weight * purity) / 100;
  
  return pureWeight * pricePerGram;
}

export function calculateTotalMetalValue(
  coins: Array<{
    weight?: number;
    purity?: number;
    metal?: string;
  }>,
  spotPrices: SpotPrices | null
): number {
  if (!spotPrices) return 0;

  return coins.reduce((total, coin) => {
    if (!coin.weight || !coin.purity || !coin.metal) return total;
    
    const metal = coin.metal.toLowerCase() as keyof SpotPrices;
    if (!spotPrices[metal]) return total;

    return total + calculateMetalValue(
      coin.weight,
      coin.purity,
      metal,
      spotPrices
    );
  }, 0);
}

export function formatCHF(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('CHF', 'CHF ');
}

export function calculateBullionValue(
  weight: number,
  purity: number,
  metal: string,
  spotPrices: SpotPrices | null
): number {
  const metalKey = metal.toLowerCase() as keyof SpotPrices;
  return calculateMetalValue(weight, purity, metalKey, spotPrices);
}

export const spotPriceService = {
  getSpotPrices: fetchSpotPrices,
  calculateBullionValue,
  formatCHF
};