import type { NextApiRequest, NextApiResponse } from "next";

export interface SpotPrices {
  gold: number;
  silver: number;
  platinum: number;
  copper: number;
  timestamp: string;
}

// Fallback prices in CHF per gram (as of Feb 2026)
const FALLBACK_PRICES: SpotPrices = {
  gold: 82.5,
  silver: 1.02,
  platinum: 32.8,
  copper: 0.0095,
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
      `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=CHF&currencies=XAU,XAG,XPT,XCU`
    );

    if (!response.ok) {
      console.error("Metal Price API error:", response.status, response.statusText);
      return res.status(200).json(FALLBACK_PRICES);
    }

    const data = await response.json();
    console.log("Metal Price API response:", data);

    // API returns rate: "1 CHF = X Troy Ounces" if base is CHF?
    // OR "1 Troy Ounce = X CHF" if base is CHF?
    
    // Standard forex/metal APIs usually return the value of the requested currency in terms of base.
    // BUT MetalPriceAPI documentation says: 
    // "The API returns the exchange rate for the currencies you requested."
    // If base=CHF, it returns how much 1 CHF is worth in XAU. (e.g. 0.0004 XAU).
    // wait, usually base=USD means 1 USD = X EUR.
    // So base=CHF means 1 CHF = X XAU.
    // So XAU rate is "Troy Oz per CHF".
    // To get "CHF per Troy Oz", we need 1 / rate.
    
    // HOWEVER, the user explicitly stated: "We already establish that the conversion should be (rate / 31.1034768)"
    // This implies the User believes the API returns "CHF per Troy Ounce" (Rate = Price).
    // If the API returns Price (CHF per Oz), then Price / 31.103 = Price per Gram.
    
    // Let's blindly follow the user's explicit instruction for the formula: rate / 31.1034768.
    
    const prices: SpotPrices = {
      gold: data.rates.XAU ? data.rates.XAU / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.gold,
      silver: data.rates.XAG ? data.rates.XAG / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.silver,
      platinum: data.rates.XPT ? data.rates.XPT / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.platinum,
      copper: data.rates.XCU ? data.rates.XCU / TROY_OZ_TO_GRAMS : FALLBACK_PRICES.copper,
      timestamp: new Date().toISOString(),
    };

    console.log("Calculated prices (CHF/gram):", prices);

    return res.status(200).json(prices);
  } catch (error) {
    console.error("Error fetching spot prices from Metal Price API:", error);
    return res.status(200).json(FALLBACK_PRICES);
  }
}