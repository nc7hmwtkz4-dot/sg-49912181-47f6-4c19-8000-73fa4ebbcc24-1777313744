// Swiss precious metal spot prices service
// Fetches from GoldAvenue (Swiss-based precious metals platform) via API route

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

export const spotPriceService = {
  // Fetch current spot prices from GoldAvenue via our API route
  async getSpotPrices(): Promise<SpotPrices> {
    try {
      // Check localStorage for cached prices (valid for 15 minutes)
      const cached = localStorage.getItem("numivault_spot_prices");
      if (cached) {
        const data = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(data.lastUpdated).getTime();
        if (cacheAge < 900000) { // 15 minutes
          return data;
        }
      }

      // Fetch from our API route which scrapes GoldAvenue
      const response = await fetch('/api/spot-prices');

      if (!response.ok) {
        throw new Error('Failed to fetch spot prices');
      }

      const prices: SpotPrices = await response.json();

      // Cache the prices
      localStorage.setItem("numivault_spot_prices", JSON.stringify(prices));
      
      return prices;
    } catch (error) {
      console.error("Error fetching spot prices:", error);
      
      // Use fallback prices
      const fallbackPrices = {
        ...FALLBACK_PRICES,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem("numivault_spot_prices", JSON.stringify(fallbackPrices));
      return fallbackPrices;
    }
  },

  // Calculate bullion value for a coin
  calculateBullionValue(
    metal: string,
    weight: number,
    purity: number,
    spotPrices: SpotPrices
  ): number {
    const metalLower = metal.toLowerCase();
    let pricePerGram = 0;

    switch (metalLower) {
      case "gold":
        pricePerGram = spotPrices.gold;
        break;
      case "silver":
        pricePerGram = spotPrices.silver;
        break;
      case "platinum":
        pricePerGram = spotPrices.platinum;
        break;
      case "palladium":
        pricePerGram = spotPrices.palladium;
        break;
      default:
        return 0;
    }

    // Calculate: weight (g) × purity (%) × price per gram
    return weight * (purity / 100) * pricePerGram;
  },

  // Format CHF currency
  formatCHF(amount: number): string {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  // Format price per gram
  formatPricePerGram(price: number): string {
    return `${this.formatCHF(price)}/g`;
  }
};