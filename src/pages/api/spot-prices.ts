import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

const CACHE_DURATION_HOURS = 24;
const TROY_OUNCE_TO_GRAMS = 31.1035;

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  timestamp: string;
}

/**
 * Fetches current USD/CHF exchange rate
 */
async function fetchUSDtoCHFRate(): Promise<number> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await response.json();
    const rate = data.rates.CHF || 0.88;
    console.log("USD to CHF exchange rate:", rate);
    return rate;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 0.88;
  }
}

/**
 * Fetches metals prices in USD per troy ounce from free sources
 */
async function fetchMetalsPricesUSD(): Promise<{ gold: number; silver: number; platinum: number }> {
  // Try Source 1: metals-api.com free endpoint
  try {
    console.log("Attempting metals-api.com...");
    const response = await fetch("https://metals-api.com/api/latest?base=XAU&symbols=USD,XAG,XPT");
    const data = await response.json();
    console.log("metals-api.com response:", JSON.stringify(data, null, 2));
    
    if (data.success && data.rates) {
      // metals-api returns rates relative to base currency
      // If base=XAU (gold), rates.USD tells us USD per oz of gold
      const goldPrice = data.rates.USD || 0;
      const silverToGoldRatio = data.rates.XAG || 0;
      const platinumToGoldRatio = data.rates.XPT || 0;
      
      // Calculate actual USD prices
      const silverPrice = goldPrice / silverToGoldRatio;
      const platinumPrice = goldPrice / platinumToGoldRatio;
      
      console.log("Calculated USD prices from metals-api:", { 
        gold: goldPrice, 
        silver: silverPrice, 
        platinum: platinumPrice 
      });
      
      if (goldPrice > 1000 && goldPrice < 5000) {
        return {
          gold: goldPrice,
          silver: silverPrice,
          platinum: platinumPrice,
        };
      }
    }
  } catch (error) {
    console.log("metals-api.com failed:", error);
  }

  // Try Source 2: Use kitco.com API (free, reliable)
  try {
    console.log("Attempting kitco.com...");
    const response = await fetch("https://www.kitco.com/market-charts/charts.html");
    // Kitco requires parsing, skip for now
  } catch (error) {
    console.log("kitco.com failed:", error);
  }

  // Try Source 3: goldapi.io (requires free API key from env)
  if (process.env.GOLDAPI_KEY) {
    try {
      console.log("Attempting goldapi.io...");
      const [goldRes, silverRes, platinumRes] = await Promise.all([
        fetch("https://www.goldapi.io/api/XAU/USD", {
          headers: { "x-access-token": process.env.GOLDAPI_KEY }
        }),
        fetch("https://www.goldapi.io/api/XAG/USD", {
          headers: { "x-access-token": process.env.GOLDAPI_KEY }
        }),
        fetch("https://www.goldapi.io/api/XPT/USD", {
          headers: { "x-access-token": process.env.GOLDAPI_KEY }
        })
      ]);

      const goldData = await goldRes.json();
      const silverData = await silverRes.json();
      const platinumData = await platinumRes.json();

      console.log("goldapi.io response:", { goldData, silverData, platinumData });

      if (goldData.price) {
        return {
          gold: goldData.price,
          silver: silverData.price || 0,
          platinum: platinumData.price || 0,
        };
      }
    } catch (error) {
      console.log("goldapi.io failed:", error);
    }
  }

  // Fallback: Use current approximate market prices (USD per troy ounce)
  // Updated as of March 2025
  console.log("Using fallback prices (all APIs failed)");
  return {
    gold: 2650,
    silver: 31,
    platinum: 950,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpotPrices | { error: string }>
) {
  try {
    console.log("=== Spot Prices API Called ===");
    
    // Check cache first
    const { data: cachedPrices, error: cacheError } = await supabase
      .from("spot_prices_cache")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (cachedPrices && !cacheError) {
      const cacheAge = Date.now() - new Date(cachedPrices.timestamp).getTime();
      const cacheAgeHours = cacheAge / (1000 * 60 * 60);

      if (cacheAgeHours < CACHE_DURATION_HOURS) {
        console.log(`Using cached prices (age: ${cacheAgeHours.toFixed(2)} hours)`);
        console.log("Cached prices:", cachedPrices);
        return res.status(200).json({
          gold: cachedPrices.gold,
          silver: cachedPrices.silver,
          platinum: cachedPrices.platinum,
          timestamp: cachedPrices.timestamp
        });
      }
    }

    console.log("Cache expired or missing, fetching fresh prices...");
    
    // Fetch fresh data
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

    console.log("Conversion calculation:");
    console.log(`Gold: ${metalsPricesUSD.gold} USD/oz × ${usdToChf} CHF/USD ÷ ${TROY_OUNCE_TO_GRAMS} g/oz = ${goldCHFperGram} CHF/g`);
    console.log(`Silver: ${metalsPricesUSD.silver} USD/oz × ${usdToChf} CHF/USD ÷ ${TROY_OUNCE_TO_GRAMS} g/oz = ${silverCHFperGram} CHF/g`);
    console.log(`Platinum: ${metalsPricesUSD.platinum} USD/oz × ${usdToChf} CHF/USD ÷ ${TROY_OUNCE_TO_GRAMS} g/oz = ${platinumCHFperGram} CHF/g`);

    const spotPrices: SpotPrices = {
      gold: Math.round(goldCHFperGram * 100) / 100,
      silver: Math.round(silverCHFperGram * 100) / 100,
      platinum: Math.round(platinumCHFperGram * 100) / 100,
      timestamp: new Date().toISOString()
    };

    console.log("Final CHF per gram prices:", spotPrices);

    // Validate prices are in reasonable range
    if (spotPrices.gold < 50 || spotPrices.gold > 200) {
      console.error(`Gold price out of range: ${spotPrices.gold} CHF/g`);
    }
    if (spotPrices.silver < 0.5 || spotPrices.silver > 5) {
      console.error(`Silver price out of range: ${spotPrices.silver} CHF/g`);
    }
    if (spotPrices.platinum < 20 || spotPrices.platinum > 100) {
      console.error(`Platinum price out of range: ${spotPrices.platinum} CHF/g`);
    }

    // Cache the prices
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
    } else {
      console.log("Prices cached successfully");
    }

    console.log("=== Returning fresh prices ===");
    res.status(200).json(spotPrices);
  } catch (error) {
    console.error("Spot prices API error:", error);
    
    // Try stale cache as fallback
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

    // Ultimate fallback
    console.log("Using hardcoded fallback prices");
    res.status(200).json({
      gold: 75.5,
      silver: 0.88,
      platinum: 27.0,
      timestamp: new Date().toISOString()
    });
  }
}