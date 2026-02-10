import type { NextApiRequest, NextApiResponse } from "next";

export interface SpotPrices {
  gold: number;    // CHF per gram
  silver: number;  // CHF per gram
  platinum: number;
  palladium: number;
  lastUpdated: string;
  timestamp: number;
}

// Fallback spot prices (approximate current market rates in CHF/gram)
const FALLBACK_PRICES: SpotPrices = {
  gold: 74.50,
  silver: 0.95,
  platinum: 30.20,
  palladium: 32.40,
  lastUpdated: new Date().toISOString(),
  timestamp: Math.floor(Date.now() / 1000)
};

// Metal Price API configuration
const API_KEY = "a4c341c9c8b69969cba65382941825cf";
const API_URL = "https://api.metalpriceapi.com/v1/latest";

// Troy ounce to gram conversion (1 troy oz = 31.1035 grams)
const TROY_OZ_TO_GRAMS = 31.1035;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpotPrices>
) {
  if (req.method !== "GET") {
    return res.status(405).json(FALLBACK_PRICES);
  }

  try {
    // Fetch from Metal Price API
    const response = await fetch(
      `${API_URL}?api_key=${API_KEY}&base=CHF&currencies=XAU,XAG,XPT,XPD`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check if API request was successful
    if (!data.success || !data.rates) {
      throw new Error("Invalid API response");
    }

    // Metal Price API returns prices as: 1 CHF = X troy ounces of metal
    // We need: 1 gram of metal = Y CHF
    // Conversion: (1 / rate) * TROY_OZ_TO_GRAMS = CHF per troy oz
    // Then: CHF per troy oz / TROY_OZ_TO_GRAMS = CHF per gram

    const prices: SpotPrices = {
      gold: data.rates.XAU ? (1 / data.rates.XAU) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.gold,
      silver: data.rates.XAG ? (1 / data.rates.XAG) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.silver,
      platinum: data.rates.XPT ? (1 / data.rates.XPT) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.platinum,
      palladium: data.rates.XPD ? (1 / data.rates.XPD) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.palladium,
      lastUpdated: new Date().toISOString(),
      timestamp: data.timestamp || Math.floor(Date.now() / 1000)
    };

    // Validate that we got valid prices
    if (prices.gold > 0 && prices.silver > 0) {
      return res.status(200).json(prices);
    }

    // If prices are invalid, use fallback
    console.warn("Invalid prices from Metal Price API, using fallback");
    return res.status(200).json(FALLBACK_PRICES);

  } catch (error) {
    console.error("Error fetching spot prices from Metal Price API:", error);
    return res.status(200).json(FALLBACK_PRICES);
  }
}