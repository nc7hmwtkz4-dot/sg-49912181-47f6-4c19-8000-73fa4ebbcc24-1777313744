import type { NextApiRequest, NextApiResponse } from "next";
import * as cheerio from "cheerio";

export interface SpotPrices {
  gold: number;    // CHF per gram
  silver: number;  // CHF per gram
  platinum: number;
  palladium: number;
  lastUpdated: string;
}

// Fallback spot prices (approximate current market rates in CHF/gram)
const FALLBACK_PRICES: SpotPrices = {
  gold: 74.50,
  silver: 0.95,
  platinum: 30.20,
  palladium: 32.40,
  lastUpdated: new Date().toISOString()
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpotPrices>
) {
  if (req.method !== "GET") {
    return res.status(405).json(FALLBACK_PRICES);
  }

  try {
    // Fetch from GoldAvenue
    const response = await fetch("https://www.goldavenue.com/fr/cours-or/chf", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse the prices from the page
    // GoldAvenue displays prices per gram in CHF
    const prices: SpotPrices = {
      gold: 0,
      silver: 0,
      platinum: 0,
      palladium: 0,
      lastUpdated: new Date().toISOString()
    };

    // Try to find price elements
    // GoldAvenue typically shows prices in a table or specific div structure
    $(".price, .spot-price, [data-metal]").each((_, element) => {
      const text = $(element).text().trim();
      const priceMatch = text.match(/(\d+[\.,]\d+)/);
      
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(",", "."));
        const metalText = $(element).closest("tr, .metal-row, .price-row").text().toLowerCase();
        
        if (metalText.includes("or") || metalText.includes("gold")) {
          prices.gold = price;
        } else if (metalText.includes("argent") || metalText.includes("silver")) {
          prices.silver = price;
        } else if (metalText.includes("platine") || metalText.includes("platinum")) {
          prices.platinum = price;
        } else if (metalText.includes("palladium")) {
          prices.palladium = price;
        }
      }
    });

    // Alternative: Look for specific price elements by structure
    if (prices.gold === 0) {
      // Try finding by common class patterns
      const goldPrice = $("[class*='gold'], [class*='or']").find(".price, .amount, .value").first().text();
      const goldMatch = goldPrice.match(/(\d+[\.,]\d+)/);
      if (goldMatch) prices.gold = parseFloat(goldMatch[1].replace(",", "."));
    }

    if (prices.silver === 0) {
      const silverPrice = $("[class*='silver'], [class*='argent']").find(".price, .amount, .value").first().text();
      const silverMatch = silverPrice.match(/(\d+[\.,]\d+)/);
      if (silverMatch) prices.silver = parseFloat(silverMatch[1].replace(",", "."));
    }

    if (prices.platinum === 0) {
      const platinumPrice = $("[class*='platinum'], [class*='platine']").find(".price, .amount, .value").first().text();
      const platinumMatch = platinumPrice.match(/(\d+[\.,]\d+)/);
      if (platinumMatch) prices.platinum = parseFloat(platinumMatch[1].replace(",", "."));
    }

    if (prices.palladium === 0) {
      const palladiumPrice = $("[class*='palladium']").find(".price, .amount, .value").first().text();
      const palladiumMatch = palladiumPrice.match(/(\d+[\.,]\d+)/);
      if (palladiumMatch) prices.palladium = parseFloat(palladiumMatch[1].replace(",", "."));
    }

    // Validate that we got at least gold and silver prices
    if (prices.gold > 0 && prices.silver > 0) {
      return res.status(200).json(prices);
    }

    // If parsing failed, use fallback
    console.warn("Failed to parse prices from GoldAvenue, using fallback");
    return res.status(200).json(FALLBACK_PRICES);

  } catch (error) {
    console.error("Error fetching spot prices from GoldAvenue:", error);
    return res.status(200).json(FALLBACK_PRICES);
  }
}