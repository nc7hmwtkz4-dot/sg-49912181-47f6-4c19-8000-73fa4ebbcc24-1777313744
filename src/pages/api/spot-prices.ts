import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

const METAL_PRICE_API_KEY = "a4c341c9c8b69969cba65382941825cf";
const TROY_OZ_TO_GRAMS = 31.1034768;
const CACHE_DURATION_HOURS = 24; // Strict 24-hour caching

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  timestamp: string;
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
    console.log("Fetching fresh metal prices from API (cache expired or missing)");
    
    const apiUrl = `https://api.metalpriceapi.com/v1/latest?api_key=${METAL_PRICE_API_KEY}&base=CHF&currencies=XAU,XAG,XPT,XCU`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Metal Price API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.rates || !data.rates.XAU || !data.rates.XAG) {
      throw new Error("Invalid API response format");
    }

    // Convert from CHF per Troy Ounce to CHF per Gram
    const spotPrices: SpotPrices = {
      gold: data.rates.XAU / TROY_OZ_TO_GRAMS,
      silver: data.rates.XAG / TROY_OZ_TO_GRAMS,
      platinum: data.rates.XPT ? data.rates.XPT / TROY_OZ_TO_GRAMS : 0,
      timestamp: new Date().toISOString()
    };

    console.log("Fresh prices fetched:", spotPrices);

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
    
    // Return fallback prices if everything fails
    res.status(200).json({
      gold: 80.5,
      silver: 0.95,
      platinum: 30.2,
      timestamp: new Date().toISOString()
    });
  }
}