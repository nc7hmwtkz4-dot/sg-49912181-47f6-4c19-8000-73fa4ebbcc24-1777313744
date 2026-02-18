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
  starting_price?: number;
  current_bid?: number;
  expected_end_date?: string;
  notes?: string;
}

// Create a new listing
export async function createListing(data: CreateListingData): Promise<{ data: Listing | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error("User not authenticated") };
    }

    // Fetch coin details first to get SKU
    const { data: coin, error: coinError } = await supabase
      .from("user_coins")
      .select("sku, coin_name")
      .eq("id", data.coinId)
      .single();

    if (coinError || !coin) {
      return { data: null, error: new Error("Coin not found or could not be retrieved") };
    }

    // Insert listing
    const { data: listing, error: listingError } = await supabase
      .from("user_listings")
      .insert({
        user_id: user.id,
        coin_id: data.coinId,
        sku: coin.sku,
        coin_name: coin.coin_name,
        listing_date: new Date().toISOString().split('T')[0],
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
          coin_name,
          year,
          metal,
          grade,
          purchase_price,
          obverse_image_url,
          reverse_image_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings:", error);
      return { data: [], error };
    }

    // Transform the data to match ListingWithCoin interface
    const listings: ListingWithCoin[] = (data || []).map(listing => {
      const coinData = Array.isArray(listing.coin) ? listing.coin[0] : listing.coin;
      const rawCoin = coinData as any;
      
      return {
        ...listing,
        coin: rawCoin ? {
          sku: rawCoin.sku,
          coinName: rawCoin.coin_name,
          year: rawCoin.year,
          metal: rawCoin.metal,
          sheldonGrade: rawCoin.grade,
          purchasePrice: rawCoin.purchase_price,
          obverseImageUrl: rawCoin.obverse_image_url,
          reverseImageUrl: rawCoin.reverse_image_url
        } : undefined
      };
    });

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
        coin:user_coins!user_listings_coin_id_fkey(purchase_price)
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
      const coinData = Array.isArray(listing.coin) ? listing.coin[0] : listing.coin;
      const rawCoin = coinData as any;
      return sum + (rawCoin?.purchase_price || 0);
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

export async function markListingAsSold(
  listingId: string,
  salePrice: number,
  saleDate: string,
  platform: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // 1. Get the listing to find the coin_id and details
    const { data: listing, error: fetchError } = await supabase
      .from("user_listings")
      .select(`
        *,
        coin:user_coins!user_listings_coin_id_fkey(
          purchase_price,
          sku,
          coin_name
        )
      `)
      .eq("id", listingId)
      .single();

    if (fetchError) throw fetchError;
    if (!listing) throw new Error("Listing not found");

    const coinData = Array.isArray(listing.coin) ? listing.coin[0] : listing.coin;
    // @ts-expect-error
    const purchasePrice = coinData?.purchase_price || 0;
    // @ts-expect-error
    const sku = coinData?.sku || listing.sku;
    // @ts-expect-error
    const coinName = coinData?.coin_name || listing.coin_name;

    const profit = salePrice - purchasePrice;
    const markupPercentage = purchasePrice > 0 ? (profit / purchasePrice) * 100 : 0;

    // 2. Update the coin's status in user_coins
    const { error: coinUpdateError } = await supabase
      .from("user_coins")
      .update({ 
        is_sold: true,
        listing_id: null 
      })
      .eq("id", listing.coin_id);

    if (coinUpdateError) throw coinUpdateError;

    // 3. Create a sale record
    const { error: saleError } = await supabase
      .from("user_sales")
      .insert({
        user_id: user.id,
        coin_id: listing.coin_id,
        sale_price: salePrice,
        sale_date: saleDate,
        purchase_price: purchasePrice,
        profit: profit,
        markup_percentage: markupPercentage,
        sku: sku,
        coin_name: coinName,
        notes: listing.notes ? `Platform: ${platform}. Notes: ${listing.notes}` : `Platform: ${platform}`
      });

    if (saleError) throw saleError;

    // 4. Delete the listing
    const { error: deleteError } = await supabase
      .from("user_listings")
      .delete()
      .eq("id", listingId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error: any) {
    console.error("Error marking listing as sold:", error);
    return { success: false, error: error.message };
  }
}