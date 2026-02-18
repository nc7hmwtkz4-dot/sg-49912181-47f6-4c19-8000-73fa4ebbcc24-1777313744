import type { NextApiRequest, NextApiResponse } from "next";

export interface SpotPrices {
  gold: number;
  silver: number;
  copper: number;
  platinum: number;
}

const METAL_PRICE_API_KEY = "a4c341c9c8b69969cba65382941825cf";
const TROY_OZ_TO_GRAMS = 31.1034768;

// Fallback prices in CHF per gram
const FALLBACK_PRICES: SpotPrices = {
  gold: 75.5,
  silver: 0.89,
  copper: 0.008,
  platinum: 28.5,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpotPrices>
) {
  try {
    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${METAL_PRICE_API_KEY}&base=CHF&currencies=XAU,XAG,XPT,XCU`
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Log the raw API response for debugging
    console.log('Metal Price API Response:', JSON.stringify(data, null, 2));

    if (!data.rates) {
      throw new Error('Invalid API response: missing rates');
    }

    // Convert rates to CHF per gram
    // API returns: 1 CHF = X oz of metal (so 1 oz = 1/X CHF)
    // Convert: CHF/oz -> CHF/g
    const prices: SpotPrices = {
      gold: data.rates.CHFXAU ? (1 / data.rates.CHFXAU) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.gold,
      silver: data.rates.CHFXAG ? (1 / data.rates.CHFXAG) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.silver,
      copper: data.rates.CHFXCU ? (1 / data.rates.CHFXCU) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.copper,
      platinum: data.rates.CHFXPT ? (1 / data.rates.CHFXPT) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.platinum,
    };

    return res.status(200).json(prices);
  } catch (error) {
    console.error("Error fetching spot prices from Metal Price API:", error);
    return res.status(200).json(FALLBACK_PRICES);
  }
}