import type { NextApiRequest, NextApiResponse } from "next";

export interface SpotPrices {
  gold: number;    // CHF per gram
  silver: number;  // CHF per gram
  copper: number;  // CHF per gram
  platinum: number; // CHF per gram
  timestamp: number;
}

// Metal Price API configuration
const API_KEY = "a4c341c9c8b69969cba65382941825cf";
const API_URL = "https://api.metalpriceapi.com/v1/latest";

// Constants for conversions
const TROY_OZ_TO_GRAMS = 31.1034768; // 1 troy oz = 31.1034768 grams
const USD_TO_CHF_RATE = 0.88; // Approximate rate

// Fallback spot prices (approximate current market rates in CHF/gram)
const FALLBACK_PRICES: SpotPrices = {
  gold: 74.50,
  silver: 0.95,
  copper: 0.01,
  platinum: 30.20,
  timestamp: Math.floor(Date.now() / 1000)
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpotPrices>
) {
  if (req.method !== "GET") {
    return res.status(405).json(FALLBACK_PRICES);
  }

  try {
    // Fetch from Metal Price API (Base is USD by default for free tier usually, let's request USD base)
    const response = await fetch(
      `${API_URL}?api_key=${API_KEY}&base=USD&currencies=XAU,XAG,XCU,XPT`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check if API request was successful
    if (!data.success && !data.rates) {
      console.error("API Error:", data);
      throw new Error("Invalid API response");
    }

    // Convert from USD per troy oz (or unit) to CHF per gram
    // API returns rates as USD per unit (e.g. 1 USD = 0.0004 XAU) -> Price of XAU in USD = 1/Rate
    // Formula: (1 / Rate_in_USD) * USD_TO_CHF_RATE / TROY_OZ_TO_GRAMS
    
    const convertToChfPerGram = (rate: number) => {
      if (!rate) return 0;
      const priceInUsdPerOz = 1 / rate;
      return (priceInUsdPerOz * USD_TO_CHF_RATE) / TROY_OZ_TO_GRAMS;
    };

    const prices: SpotPrices = {
      gold: convertToChfPerGram(data.rates.XAU || 0) || FALLBACK_PRICES.gold,
      silver: convertToChfPerGram(data.rates.XAG || 0) || FALLBACK_PRICES.silver,
      copper: convertToChfPerGram(data.rates.XCU || 0) || FALLBACK_PRICES.copper,
      platinum: convertToChfPerGram(data.rates.XPT || 0) || FALLBACK_PRICES.platinum,
      timestamp: data.timestamp || Math.floor(Date.now() / 1000)
    };

    return res.status(200).json(prices);

  } catch (error) {
    console.error("Error fetching spot prices from Metal Price API:", error);
    return res.status(200).json(FALLBACK_PRICES);
  }
}