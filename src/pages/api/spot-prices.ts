import type { NextApiRequest, NextApiResponse } from "next";

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
}

const METAL_PRICE_API_KEY = "a4c341c9c8b69969cba65382941825cf";
const TROY_OZ_TO_GRAMS = 31.1034768;

// Fallback prices in CHF per gram
const FALLBACK_PRICES: SpotPrices = {
  gold: 75.5,
  silver: 0.89,
  platinum: 28.5,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpotPrices>
) {
  try {
    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${METAL_PRICE_API_KEY}&base=CHF&currencies=XAU,XAG,XPT`
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
    // API returns rates like CHFXAU: 3834.56 (meaning 1 troy oz = 3834.56 CHF)
    // Convert: CHF/oz -> CHF/g by dividing by troy oz to grams constant
    const prices: SpotPrices = {
      gold: data.rates.CHFXAU ? data.rates.CHFXAU / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.gold,
      silver: data.rates.CHFXAG ? data.rates.CHFXAG / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.silver,
      platinum: data.rates.CHFXPT ? data.rates.CHFXPT / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.platinum,
    };

    console.log('Calculated prices per gram:', prices);

    return res.status(200).json(prices);
  } catch (error) {
    console.error("Error fetching spot prices from Metal Price API:", error);
    return res.status(200).json(FALLBACK_PRICES);
  }
}