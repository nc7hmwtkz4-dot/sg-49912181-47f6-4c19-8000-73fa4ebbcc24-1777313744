import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Listing = Tables<"user_listings">;

export interface ListingWithCoin extends Listing {
  coin?: {
    sku: string;
    coinName: string;
    year: number;
    metal: string;
    sheldonGrade: string;
    purchasePrice: number;
    obverseImageUrl?: string;
    reverseImageUrl?: string;
  };
}

export interface CreateListingData {
  coinId: string;
  platform: string;
  startingPrice: number;
  currentBid?: number;
  expectedEndDate?: string;
  notes?: string;
}

export interface UpdateListingData {
  platform?: string;
  startingPrice?: number;
  currentBid?: number;
  expectedEndDate?: string;
  notes?: string;
}

// Create a new listing
export async function createListing(data: CreateListingData): Promise<{ data: Listing | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error("User not authenticated") };
    }

    // Insert listing
    const { data: listing, error: listingError } = await supabase
      .from("user_listings")
      .insert({
        user_id: user.id,
        coin_id: data.coinId,
        platform: data.platform,
        starting_price: data.startingPrice,
        current_bid: data.currentBid,
        expected_end_date: data.expectedEndDate,
        notes: data.notes
      })
      .select()
      .single();

    if (listingError) {
      console.error("Error creating listing:", listingError);
      return { data: null, error: listingError };
    }

    // Update coin's listing_id
    const { error: coinUpdateError } = await supabase
      .from("user_coins")
      .update({ listing_id: listing.id })
      .eq("id", data.coinId);

    if (coinUpdateError) {
      console.error("Error updating coin listing_id:", coinUpdateError);
      // Rollback: delete the listing
      await supabase.from("user_listings").delete().eq("id", listing.id);
      return { data: null, error: coinUpdateError };
    }

    return { data: listing, error: null };
  } catch (err) {
    console.error("Unexpected error in createListing:", err);
    return { data: null, error: err as Error };
  }
}

// Get all active listings for current user
export async function getActiveListings(): Promise<{ data: ListingWithCoin[]; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], error: new Error("User not authenticated") };
    }

    const { data, error } = await supabase
      .from("user_listings")
      .select(`
        *,
        coin:user_coins!user_listings_coin_id_fkey(
          sku,
          coinName,
          year,
          metal,
          sheldonGrade,
          purchasePrice,
          obverseImageUrl,
          reverseImageUrl
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings:", error);
      return { data: [], error };
    }

    // Transform the data to match ListingWithCoin interface
    const listings: ListingWithCoin[] = (data || []).map(listing => ({
      ...listing,
      coin: Array.isArray(listing.coin) ? listing.coin[0] : listing.coin
    }));

    return { data: listings, error: null };
  } catch (err) {
    console.error("Unexpected error in getActiveListings:", err);
    return { data: [], error: err as Error };
  }
}

// Update a listing
export async function updateListing(listingId: string, updates: UpdateListingData): Promise<{ data: Listing | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("user_listings")
      .update(updates)
      .eq("id", listingId)
      .select()
      .single();

    if (error) {
      console.error("Error updating listing:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error in updateListing:", err);
    return { data: null, error: err as Error };
  }
}

// Delete a listing (and remove listing_id from coin)
export async function deleteListing(listingId: string, coinId: string): Promise<{ error: Error | null }> {
  try {
    // Remove listing_id from coin first
    const { error: coinUpdateError } = await supabase
      .from("user_coins")
      .update({ listing_id: null })
      .eq("id", coinId);

    if (coinUpdateError) {
      console.error("Error removing listing_id from coin:", coinUpdateError);
      return { error: coinUpdateError };
    }

    // Delete the listing
    const { error: deleteError } = await supabase
      .from("user_listings")
      .delete()
      .eq("id", listingId);

    if (deleteError) {
      console.error("Error deleting listing:", deleteError);
      return { error: deleteError };
    }

    return { error: null };
  } catch (err) {
    console.error("Unexpected error in deleteListing:", err);
    return { error: err as Error };
  }
}

// Get listing statistics
export async function getListingStats(): Promise<{
  data: {
    totalListings: number;
    totalPurchaseValue: number;
    totalListingValue: number;
  };
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: { totalListings: 0, totalPurchaseValue: 0, totalListingValue: 0 },
        error: new Error("User not authenticated")
      };
    }

    const { data, error } = await supabase
      .from("user_listings")
      .select(`
        id,
        starting_price,
        current_bid,
        coin:user_coins!user_listings_coin_id_fkey(purchasePrice)
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching listing stats:", error);
      return {
        data: { totalListings: 0, totalPurchaseValue: 0, totalListingValue: 0 },
        error
      };
    }

    const listings = data || [];
    const totalListings = listings.length;
    const totalPurchaseValue = listings.reduce((sum, listing) => {
      const coin = Array.isArray(listing.coin) ? listing.coin[0] : listing.coin;
      return sum + (coin?.purchasePrice || 0);
    }, 0);
    const totalListingValue = listings.reduce((sum, listing) => {
      const highestPrice = Math.max(listing.starting_price, listing.current_bid || 0);
      return sum + highestPrice;
    }, 0);

    return {
      data: { totalListings, totalPurchaseValue, totalListingValue },
      error: null
    };
  } catch (err) {
    console.error("Unexpected error in getListingStats:", err);
    return {
      data: { totalListings: 0, totalPurchaseValue: 0, totalListingValue: 0 },
      error: err as Error
    };
  }
}