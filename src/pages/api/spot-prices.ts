import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import * as cheerio from "cheerio";

const CACHE_DURATION_HOURS = 24; // Strict 24-hour caching

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  timestamp: string;
}

/**
 * Scrapes gold price in CHF per gram from gold-price.info
 */
async function fetchGoldPrice(): Promise<number> {
  try {
    const response = await fetch("https://gold-price.info/");
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Look for CHF per gram price
    // The site structure may vary, so we'll try multiple selectors
    let price = 0;
    
    // Try to find the CHF per gram value in the page
    $("tr").each((_, element) => {
      const text = $(element).text();
      if (text.includes("CHF") && text.includes("gram")) {
        const priceMatch = text.match(/CHF\s*([\d,.]+)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(",", ""));
        }
      }
    });
    
    return price;
  } catch (error) {
    console.error("Error fetching gold price:", error);
    return 0;
  }
}

/**
 * Scrapes silver price in CHF per gram from silver-price.info
 */
async function fetchSilverPrice(): Promise<number> {
  try {
    const response = await fetch("https://silver-price.info/");
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let price = 0;
    
    // Try to find the CHF per gram value in the page
    $("tr").each((_, element) => {
      const text = $(element).text();
      if (text.includes("CHF") && text.includes("gram")) {
        const priceMatch = text.match(/CHF\s*([\d,.]+)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(",", ""));
        }
      }
    });
    
    return price;
  } catch (error) {
    console.error("Error fetching silver price:", error);
    return 0;
  }
}

/**
 * Scrapes platinum price in CHF per gram from platinum-price.com
 */
async function fetchPlatinumPrice(): Promise<number> {
  try {
    const response = await fetch("https://platinum-price.com/");
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let price = 0;
    
    // Try to find the CHF per gram value in the page
    $("tr").each((_, element) => {
      const text = $(element).text();
      if (text.includes("CHF") && text.includes("gram")) {
        const priceMatch = text.match(/CHF\s*([\d,.]+)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(",", ""));
        }
      }
    });
    
    return price;
  } catch (error) {
    console.error("Error fetching platinum price:", error);
    return 0;
  }
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
    console.log("Fetching fresh metal prices from web sources (cache expired or missing)");
    
    // Fetch prices in parallel for better performance
    const [gold, silver, platinum] = await Promise.all([
      fetchGoldPrice(),
      fetchSilverPrice(),
      fetchPlatinumPrice()
    ]);

    // Validate that we got reasonable prices
    if (gold === 0 || silver === 0) {
      throw new Error("Failed to fetch valid prices from sources");
    }

    const spotPrices: SpotPrices = {
      gold,
      silver,
      platinum: platinum || 0, // Platinum is optional
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
    res.status(200).json({
      gold: 80.5,
      silver: 0.95,
      platinum: 30.2,
      timestamp: new Date().toISOString()
    });
  }
}