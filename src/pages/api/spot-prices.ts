import type { NextApiRequest, NextApiResponse } from "next";

export interface SpotPrices {
  gold: number;
  silver: number;
  copper: number;
  platinum: number;
}

const METAL_PRICE_API_KEY = "a4c341c9c8b69969cba65382941825cf";
const USD_TO_CHF = 0.88; // Approximate conversion rate
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
      `https://api.metalpriceapi.com/v1/latest?api_key=${METAL_PRICE_API_KEY}&base=USD&currencies=XAU,XAG,XPT,XCU`
    );

    if (!response.ok) {
      console.error("Metal Price API error:", response.statusText);
      return res.status(200).json(FALLBACK_PRICES);
    }

    const data = await response.json();

    if (!data.success || !data.rates) {
      console.error("Invalid API response format");
      return res.status(200).json(FALLBACK_PRICES);
    }

    // Convert rates to CHF per gram
    // API returns: 1 USD = X oz of metal (so 1 oz = 1/X USD)
    // Convert: USD/oz -> CHF/oz -> CHF/g
    const prices: SpotPrices = {
      gold: data.rates.XAU ? ((1 / data.rates.XAU) * USD_TO_CHF) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.gold,
      silver: data.rates.XAG ? ((1 / data.rates.XAG) * USD_TO_CHF) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.silver,
      copper: data.rates.XCU ? ((1 / data.rates.XCU) * USD_TO_CHF) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.copper,
      platinum: data.rates.XPT ? ((1 / data.rates.XPT) * USD_TO_CHF) / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.platinum,
    };

    return res.status(200).json(prices);
  } catch (error) {
    console.error("Error fetching spot prices from Metal Price API:", error);
    return res.status(200).json(FALLBACK_PRICES);
  }
}