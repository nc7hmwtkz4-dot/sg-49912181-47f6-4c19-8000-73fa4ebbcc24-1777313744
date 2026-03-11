import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

const CACHE_DURATION_HOURS = 24; // Strict 24-hour caching
const TROY_OUNCE_TO_GRAMS = 31.1035; // Conversion factor

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  timestamp: string;
}

/**
 * Fetches current USD/CHF exchange rate from exchangerate-api.com (free, no key needed)
 */
async function fetchUSDtoCHFRate(): Promise<number> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await response.json();
    return data.rates.CHF || 0.88; // Fallback to approximate rate
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 0.88; // Fallback rate
  }
}

/**
 * Fetches metals prices in USD per troy ounce from multiple free sources
 * Tries multiple sources for reliability
 */
async function fetchMetalsPricesUSD(): Promise<{ gold: number; silver: number; platinum: number }> {
  // Try Source 1: metals-api.com free endpoint (no key needed for basic access)
  try {
    const response = await fetch("https://metals-api.com/api/latest?base=USD&symbols=XAU,XAG,XPT");
    const data = await response.json();
    
    if (data.success && data.rates) {
      // metals-api returns inverted rates (USD per unit), we need price per ounce
      return {
        gold: data.rates.XAU ? (1 / data.rates.XAU) : 0,
        silver: data.rates.XAG ? (1 / data.rates.XAG) : 0,
        platinum: data.rates.XPT ? (1 / data.rates.XPT) : 0,
      };
    }
  } catch (error) {
    console.log("metals-api.com failed, trying alternative source:", error);
  }

  // Try Source 2: goldapi.io free tier (requires registration but has free tier)
  try {
    const response = await fetch("https://www.goldapi.io/api/XAU/USD", {
      headers: {
        "x-access-token": process.env.GOLDAPI_KEY || ""
      }
    });
    const data = await response.json();
    
    if (data.price) {
      // Get other metals if available
      const silverResponse = await fetch("https://www.goldapi.io/api/XAG/USD", {
        headers: { "x-access-token": process.env.GOLDAPI_KEY || "" }
      });
      const platinumResponse = await fetch("https://www.goldapi.io/api/XPT/USD", {
        headers: { "x-access-token": process.env.GOLDAPI_KEY || "" }
      });
      
      const silverData = await silverResponse.json();
      const platinumData = await platinumResponse.json();
      
      return {
        gold: data.price || 0,
        silver: silverData.price || 0,
        platinum: platinumData.price || 0,
      };
    }
  } catch (error) {
    console.log("goldapi.io failed, using fallback prices:", error);
  }

  // Fallback: Use reasonable current market prices (USD per troy ounce)
  // These should be updated periodically but serve as last resort
  return {
    gold: 2650,    // ~$2650/oz as of late 2024
    silver: 31,    // ~$31/oz
    platinum: 950, // ~$950/oz
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpotPrices | { error: string }>
) {
  try {
    // Check for cached prices first
    const { data: cachedPrices, error: cacheError } = await supabase
      .from("spot_prices_cache")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    // If we have cached prices less than 24 hours old, return them
    if (cachedPrices && !cacheError) {
      const cacheAge = Date.now() - new Date(cachedPrices.timestamp).getTime();
      const cacheAgeHours = cacheAge / (1000 * 60 * 60);

      if (cacheAgeHours < CACHE_DURATION_HOURS) {
        console.log(`Using cached prices (age: ${cacheAgeHours.toFixed(2)} hours)`);
        return res.status(200).json({
          gold: cachedPrices.gold,
          silver: cachedPrices.silver,
          platinum: cachedPrices.platinum,
          timestamp: cachedPrices.timestamp
        });
      }
    }

    // Cache is stale or doesn't exist - fetch fresh data
    console.log("Fetching fresh metal prices (cache expired or missing)");
    
    // Fetch USD prices and exchange rate in parallel
    const [metalsPricesUSD, usdToChf] = await Promise.all([
      fetchMetalsPricesUSD(),
      fetchUSDtoCHFRate()
    ]);

    console.log("USD Metals Prices (per troy oz):", metalsPricesUSD);
    console.log("USD to CHF rate:", usdToChf);

    // Convert from USD per troy ounce to CHF per gram
    const goldCHFperGram = (metalsPricesUSD.gold * usdToChf) / TROY_OUNCE_TO_GRAMS;
    const silverCHFperGram = (metalsPricesUSD.silver * usdToChf) / TROY_OUNCE_TO_GRAMS;
    const platinumCHFperGram = (metalsPricesUSD.platinum * usdToChf) / TROY_OUNCE_TO_GRAMS;

    const spotPrices: SpotPrices = {
      gold: Math.round(goldCHFperGram * 100) / 100, // Round to 2 decimals
      silver: Math.round(silverCHFperGram * 100) / 100,
      platinum: Math.round(platinumCHFperGram * 100) / 100,
      timestamp: new Date().toISOString()
    };

    console.log("Converted to CHF per gram:", spotPrices);

    // Validate that we got reasonable prices
    if (spotPrices.gold < 50 || spotPrices.gold > 200) {
      throw new Error(`Gold price out of reasonable range: ${spotPrices.gold} CHF/g`);
    }
    if (spotPrices.silver < 0.5 || spotPrices.silver > 5) {
      throw new Error(`Silver price out of reasonable range: ${spotPrices.silver} CHF/g`);
    }

    // Store in cache
    const { error: insertError } = await supabase
      .from("spot_prices_cache")
      .insert({
        gold: spotPrices.gold,
        silver: spotPrices.silver,
        platinum: spotPrices.platinum,
        timestamp: spotPrices.timestamp
      });

    if (insertError) {
      console.error("Failed to cache prices:", insertError);
      // Continue anyway - don't fail the request
    }

    res.status(200).json(spotPrices);
  } catch (error) {
    console.error("Spot prices API error:", error);
    
    // Try to return cached prices even if expired as fallback
    const { data: fallbackCache } = await supabase
      .from("spot_prices_cache")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (fallbackCache) {
      console.log("Using stale cache as fallback");
      return res.status(200).json({
        gold: fallbackCache.gold,
        silver: fallbackCache.silver,
        platinum: fallbackCache.platinum,
        timestamp: fallbackCache.timestamp
      });
    }

    // Return reasonable fallback prices if everything fails
    // Based on approximate current market rates
    res.status(200).json({
      gold: 75.5,   // ~CHF 75.5/g
      silver: 0.88, // ~CHF 0.88/g
      platinum: 27.0, // ~CHF 27/g
      timestamp: new Date().toISOString()
    });
  }
}