import type { NextApiRequest, NextApiResponse } from "next";

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  timestamp: string;
}

// Fallback prices in CHF per gram (as of Feb 2026)
const FALLBACK_PRICES: SpotPrices = {
  gold: 80.5,
  silver: 0.95,
  platinum: 30.2,
  timestamp: new Date().toISOString(),
};

const TROY_OZ_TO_GRAMS = 31.1034768;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpotPrices>
) {
  try {
    const apiKey = 'a4c341c9c8b69969cba65382941825cf';
    // Requesting CHF base currency
    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=CHF&currencies=XAU,XAG,XPT`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      console.error("Metal Price API error:", response.status, response.statusText);
      return res.status(200).json(FALLBACK_PRICES);
    }

    const data = await response.json();
    console.log("Metal Price API response:", data);

    // Base is CHF, currencies are XAU (Gold), XAG (Silver), XPT (Platinum)
    // Log raw rates to understand what the API returns
    console.log("Raw API rates:", {
      XAU: data.rates.XAU,
      XAG: data.rates.XAG,
      XPT: data.rates.XPT
    });

    const spotPrices: SpotPrices & { raw_rates?: Record<string, number> } = {
      gold: data.rates.XAU / TROY_OZ_TO_GRAMS,
      silver: data.rates.XAG / TROY_OZ_TO_GRAMS,
      platinum: data.rates.XPT / TROY_OZ_TO_GRAMS,
      timestamp: new Date().toISOString(),
      raw_rates: data.rates // sending raw rates for debugging
    };

    console.log("Calculated prices (CHF/gram):", spotPrices);
    console.log("Expected gold price should be ~125 CHF/gram");

    return res.status(200).json(spotPrices);
  } catch (error) {
    console.error("Error fetching spot prices from Metal Price API:", error);
    return res.status(200).json(FALLBACK_PRICES);
  }
}