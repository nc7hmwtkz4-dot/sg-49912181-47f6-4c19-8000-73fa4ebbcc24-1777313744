import { supabase } from "@/integrations/supabase/client";

/**
 * Ricardo.ch API Service
 * Documentation: https://ws.ricardo.ch/RicardoApi/documentation/html/N_Ricardo_Contracts.htm
 * 
 * TODO: Complete these based on Ricardo API documentation:
 * - API authentication method (API key, OAuth, etc.)
 * - Base URL for API endpoints
 * - Category ID for coins
 * - Rate limits and caching strategy
 */

// TODO: Add these to .env.local once we have credentials
const RICARDO_API_BASE_URL = process.env.RICARDO_API_BASE_URL || "https://ws.ricardo.ch/RicardoApi";
const RICARDO_API_KEY = process.env.RICARDO_API_KEY || "";
const RICARDO_API_SECRET = process.env.RICARDO_API_SECRET || "";

// TODO: Find the correct category ID for coins from Ricardo API
const COINS_CATEGORY_ID = "TODO";

export interface RicardoListing {
  id: string;
  title: string;
  description: string;
  currentPrice: number;
  currency: string;
  endDate: string;
  imageUrl?: string;
  url: string;
  seller?: {
    name: string;
    rating?: number;
  };
}

export interface OpportunityMatch {
  listing: RicardoListing;
  matchedSku?: string;
  meltValue?: number;
  opportunityScore?: number;
  collectionStatus: "owned" | "upgrade" | "new" | "unknown";
}

/**
 * Authenticates with Ricardo API
 * TODO: Implement based on Ricardo's authentication method
 */
async function authenticateRicardo(): Promise<string | null> {
  try {
    // TODO: Implement authentication flow
    // This might be:
    // - Simple API key in header
    // - OAuth flow
    // - Session token
    
    console.log("Authenticating with Ricardo API...");
    
    // Placeholder for authentication logic
    return RICARDO_API_KEY || null;
  } catch (error) {
    console.error("Ricardo authentication failed:", error);
    return null;
  }
}

/**
 * Searches Ricardo for gold and silver coin listings
 * TODO: Implement based on Ricardo's search endpoint
 */
export async function searchRicardoCoins(): Promise<RicardoListing[]> {
  try {
    const authToken = await authenticateRicardo();
    if (!authToken) {
      throw new Error("Failed to authenticate with Ricardo API");
    }

    // TODO: Replace with actual Ricardo API search endpoint
    const searchParams = new URLSearchParams({
      // categoryId: COINS_CATEGORY_ID,
      // keywords: "gold OR silver OR or OR argent", // French for gold/silver
      // isAuction: "true",
      // isActive: "true",
      // sortBy: "endDate",
    });

    console.log("Searching Ricardo for coin listings...");

    // TODO: Make actual API request
    const response = await fetch(
      `${RICARDO_API_BASE_URL}/search?${searchParams}`,
      {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Ricardo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // TODO: Parse Ricardo's response format and map to RicardoListing
    const listings: RicardoListing[] = [];
    
    console.log(`Found ${listings.length} coin listings`);
    return listings;

  } catch (error) {
    console.error("Error searching Ricardo:", error);
    throw error;
  }
}

/**
 * Gets detailed information for a specific listing
 * TODO: Implement based on Ricardo's listing detail endpoint
 */
export async function getRicardoListingDetails(listingId: string): Promise<RicardoListing | null> {
  try {
    const authToken = await authenticateRicardo();
    if (!authToken) {
      throw new Error("Failed to authenticate with Ricardo API");
    }

    // TODO: Make actual API request to get listing details
    const response = await fetch(
      `${RICARDO_API_BASE_URL}/listings/${listingId}`,
      {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // TODO: Parse and return listing details
    return null;

  } catch (error) {
    console.error(`Error fetching listing ${listingId}:`, error);
    return null;
  }
}

/**
 * Attempts to match a Ricardo listing to a coin in the reference database
 * Uses keyword matching on title/description
 */
export async function matchListingToSku(listing: RicardoListing): Promise<string | null> {
  try {
    // Extract key information from title
    const title = listing.title.toLowerCase();
    
    // Common patterns to look for
    const yearMatch = title.match(/\b(18|19|20)\d{2}\b/);
    const denominationMatch = title.match(/\b(\d+)\s*(francs?|fr\.?|chf)\b/i);
    
    // TODO: Enhance with more sophisticated matching
    // - Image recognition?
    // - Description parsing for weight/purity
    // - Match against coin_references table
    
    const { data: coinRefs, error } = await supabase
      .from("coin_references")
      .select("sku, name, year, denomination")
      .ilike("name", `%${title.substring(0, 50)}%`)
      .limit(5);

    if (error || !coinRefs || coinRefs.length === 0) {
      console.log(`No SKU match found for: ${listing.title}`);
      return null;
    }

    // Return best match (first result for now)
    console.log(`Matched listing to SKU: ${coinRefs[0].sku}`);
    return coinRefs[0].sku;

  } catch (error) {
    console.error("Error matching listing to SKU:", error);
    return null;
  }
}

/**
 * Calculates if a listing represents a good opportunity
 * Based on current auction price vs melt value
 */
export async function calculateOpportunity(
  listing: RicardoListing,
  sku?: string
): Promise<OpportunityMatch> {
  try {
    let meltValue: number | undefined;
    let collectionStatus: "owned" | "upgrade" | "new" | "unknown" = "unknown";

    // If we have a SKU match, get coin details and calculate melt value
    if (sku) {
      const { data: coinRef } = await supabase
        .from("coin_references")
        .select("weight, purity, metal")
        .eq("sku", sku)
        .single();

      if (coinRef) {
        // Get current spot prices
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("gold_price_chf_per_gram, silver_price_chf_per_gram")
            .eq("id", user.id)
            .single();

          if (profile && coinRef.weight && coinRef.purity) {
            const pricePerGram = coinRef.metal?.toLowerCase() === "gold"
              ? profile.gold_price_chf_per_gram
              : profile.silver_price_chf_per_gram;

            if (pricePerGram) {
              const purity = coinRef.purity > 1 ? coinRef.purity / 100 : coinRef.purity;
              meltValue = coinRef.weight * purity * pricePerGram;
            }
          }

          // Check collection status
          const { data: userCoins } = await supabase
            .from("user_coins")
            .select("grade")
            .eq("user_id", user.id)
            .eq("sku", sku);

          if (userCoins && userCoins.length > 0) {
            // TODO: Check if this is an upgrade opportunity
            collectionStatus = "owned";
          } else {
            collectionStatus = "new";
          }
        }
      }
    }

    // Calculate opportunity score
    let opportunityScore: number | undefined;
    if (meltValue) {
      const priceVsMelt = (listing.currentPrice / meltValue) * 100;
      opportunityScore = priceVsMelt;
    }

    return {
      listing,
      matchedSku: sku || undefined,
      meltValue,
      opportunityScore,
      collectionStatus,
    };

  } catch (error) {
    console.error("Error calculating opportunity:", error);
    return {
      listing,
      collectionStatus: "unknown",
    };
  }
}

export const ricardoService = {
  searchCoins: searchRicardoCoins,
  getListingDetails: getRicardoListingDetails,
  matchToSku: matchListingToSku,
  calculateOpportunity,
};