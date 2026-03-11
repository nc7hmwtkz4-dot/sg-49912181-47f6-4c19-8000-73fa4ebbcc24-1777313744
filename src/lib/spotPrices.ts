import { supabase } from "@/integrations/supabase/client";

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  timestamp: string;
}

/**
 * Fetches user's manually configured spot prices from their profile
 * @returns Spot prices in CHF per gram from user settings
 */
export const fetchSpotPrices = async (): Promise<SpotPrices> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("No authenticated user found, using default prices");
      return {
        gold: 85.00,
        silver: 0.95,
        platinum: 28.00,
        timestamp: new Date().toISOString()
      };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("gold_price_chf_per_gram, silver_price_chf_per_gram, platinum_price_chf_per_gram, prices_last_updated")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      console.error("Error fetching user prices:", error);
      return {
        gold: 85.00,
        silver: 0.95,
        platinum: 28.00,
        timestamp: new Date().toISOString()
      };
    }

    return {
      gold: profile.gold_price_chf_per_gram || 85.00,
      silver: profile.silver_price_chf_per_gram || 0.95,
      platinum: profile.platinum_price_chf_per_gram || 28.00,
      timestamp: profile.prices_last_updated || new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching spot prices:", error);
    return {
      gold: 85.00,
      silver: 0.95,
      platinum: 28.00,
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