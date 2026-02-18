// Metal price service using Metal Price API
// Caches prices for 24 hours to limit API calls to 1 per day

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

// Cache duration: 24 hours (86400000 milliseconds)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

const METAL_PRICE_API_KEY = 'a4c341c9c8b69969cba65382941825cf';
const API_URL = 'https://api.metalpriceapi.com/v1/latest';

// Constants for conversions
const TROY_OZ_TO_GRAMS = 31.1034768; // 1 troy oz = 31.1034768 grams
const USD_TO_CHF_RATE = 0.88; // Approximate rate, you can make this dynamic later

interface MetalPrices {
  gold: number;
  silver: number;
  copper: number;
  platinum: number;
  timestamp: number;
}

export async function fetchSpotPrices(): Promise<MetalPrices | null> {
  try {
    const response = await fetch(
      `${API_URL}?api_key=${METAL_PRICE_API_KEY}&base=USD&currencies=XAU,XAG,XCU,XPT`
    );

    if (!response.ok) {
      console.error('Failed to fetch spot prices:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (!data.rates) {
      console.error('Invalid API response:', data);
      return null;
    }

    // Convert from USD per troy oz to CHF per gram
    // API returns rates as USD per unit, we need to invert and convert
    const convertToChfPerGram = (usdPerTroyOz: number) => {
      return (1 / usdPerTroyOz) * USD_TO_CHF_RATE * TROY_OZ_TO_GRAMS;
    };

    return {
      gold: convertToChfPerGram(data.rates.XAU || 0),
      silver: convertToChfPerGram(data.rates.XAG || 0),
      copper: convertToChfPerGram(data.rates.XCU || 0),
      platinum: convertToChfPerGram(data.rates.XPT || 0),
      timestamp: data.timestamp || Date.now()
    };
  } catch (error) {
    console.error('Error fetching spot prices:', error);
    return null;
  }
}

export const spotPriceService = {
  // Fetch current spot prices from Metal Price API via our API route
  // Cached for 24 hours to limit API calls
  async getSpotPrices(forceRefresh = false): Promise<SpotPrices> {
    try {
      // Check localStorage for cached prices (valid for 24 hours)
      if (!forceRefresh) {
        const cached = localStorage.getItem("numivault_spot_prices");
        if (cached) {
          const data = JSON.parse(cached);
          const cacheAge = Date.now() - new Date(data.lastUpdated).getTime();
          
          // Return cached data if less than 24 hours old
          if (cacheAge < CACHE_DURATION_MS) {
            console.log(`Using cached spot prices (age: ${Math.round(cacheAge / 3600000)} hours)`);
            return data;
          }
          
          console.log("Cache expired, fetching fresh prices...");
        }
      }

      // Fetch from our API route which calls Metal Price API
      console.log("Fetching spot prices from Metal Price API...");
      const response = await fetch('/api/spot-prices');

      if (!response.ok) {
        throw new Error('Failed to fetch spot prices');
      }

      const prices: SpotPrices = await response.json();

      // Cache the prices for 24 hours
      localStorage.setItem("numivault_spot_prices", JSON.stringify(prices));
      console.log("Spot prices cached successfully");
      
      return prices;
    } catch (error) {
      console.error("Error fetching spot prices:", error);
      
      // Check if we have any cached prices (even if expired)
      const cached = localStorage.getItem("numivault_spot_prices");
      if (cached) {
        const data = JSON.parse(cached);
        console.log("Using expired cache as fallback");
        return data;
      }
      
      // Use fallback prices as last resort
      const fallbackPrices = {
        ...FALLBACK_PRICES,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem("numivault_spot_prices", JSON.stringify(fallbackPrices));
      console.log("Using fallback prices");
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
  },

  // Get cache age in hours (for display purposes)
  getCacheAge(): number | null {
    try {
      const cached = localStorage.getItem("numivault_spot_prices");
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const ageMs = Date.now() - new Date(data.lastUpdated).getTime();
      return Math.round(ageMs / 3600000); // Convert to hours
    } catch {
      return null;
    }
  },

  // Check if cache is still valid
  isCacheValid(): boolean {
    try {
      const cached = localStorage.getItem("numivault_spot_prices");
      if (!cached) return false;
      
      const data = JSON.parse(cached);
      const cacheAge = Date.now() - new Date(data.lastUpdated).getTime();
      return cacheAge < CACHE_DURATION_MS;
    } catch {
      return false;
    }
  }
};