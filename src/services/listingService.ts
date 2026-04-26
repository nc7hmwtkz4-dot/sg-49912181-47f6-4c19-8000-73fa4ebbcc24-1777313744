import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Listing = Tables<"user_listings">;

export interface ListingWithCoin extends Listing {
  coin?: {
    sku: string;
    coinName: string;
    year: number;
    sheldonGrade: string;
    purchasePrice: number;
    obverseImageUrl?: string;
    reverseImageUrl?: string;
    metal?: string;
    purity?: number;
    weight?: number;
    weightNet?: number;
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

// Get all active listings for current user with reference data
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
          grade,
          purchase_price,
          obverse_image_url,
          reverse_image_url,
          coins_reference!user_coins_reference_coin_id_fkey(
            metal,
            purity,
            weight,
            weight_net
          )
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
      const rawCoin = coinData as {
        sku: string;
        coin_name: string;
        year: number;
        grade: string;
        purchase_price: number;
        obverse_image_url?: string;
        reverse_image_url?: string;
        coins_reference?: {
          metal: string;
          purity: number;
          weight: number;
          weight_net: number;
        };
      } | undefined;
      
      const refData = Array.isArray(rawCoin?.coins_reference) 
        ? rawCoin.coins_reference[0] 
        : rawCoin?.coins_reference;

      return {
        ...listing,
        coin: rawCoin ? {
          sku: rawCoin.sku,
          coinName: rawCoin.coin_name,
          year: rawCoin.year,
          sheldonGrade: rawCoin.grade,
          purchasePrice: rawCoin.purchase_price,
          obverseImageUrl: rawCoin.obverse_image_url,
          reverseImageUrl: rawCoin.reverse_image_url,
          metal: refData?.metal,
          purity: refData?.purity,
          weight: refData?.weight,
          weightNet: refData?.weight_net
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
    totalStartingPrice: number;
    totalListingValue: number;
  };
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: { totalListings: 0, totalPurchaseValue: 0, totalStartingPrice: 0, totalListingValue: 0 },
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
        data: { totalListings: 0, totalPurchaseValue: 0, totalStartingPrice: 0, totalListingValue: 0 },
        error
      };
    }

    const listings = data || [];
    const totalListings = listings.length;
    const totalPurchaseValue = listings.reduce((sum, listing) => {
      const coinData = Array.isArray(listing.coin) ? listing.coin[0] : listing.coin;
      const rawCoin = coinData as { purchase_price?: number } | undefined;
      return sum + (rawCoin?.purchase_price || 0);
    }, 0);
    const totalStartingPrice = listings.reduce((sum, listing) => sum + (listing.starting_price || 0), 0);
    const totalListingValue = listings.reduce((sum, listing) => {
      const highestPrice = Math.max(listing.starting_price, listing.current_bid || 0);
      return sum + highestPrice;
    }, 0);

    return {
      data: { totalListings, totalPurchaseValue, totalStartingPrice, totalListingValue },
      error: null
    };
  } catch (err) {
    console.error("Unexpected error in getListingStats:", err);
    return {
      data: { totalListings: 0, totalPurchaseValue: 0, totalStartingPrice: 0, totalListingValue: 0 },
      error: err as Error
    };
  }
}

export async function markListingAsSold(
  listingId: string,
  salePrice: number,
  saleDate: string,
  buyerId?: string,
  shippingCost?: number,
  platformFees?: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Step 1: Get the listing details
    const { data: listing, error: listingError } = await supabase
      .from("user_listings")
      .select("*")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      console.error("Error fetching listing:", listingError);
      return { success: false, error: "Failed to fetch listing details" };
    }

    const coinId = listing.coin_id;

    // Step 2: Get the coin details for purchase price
    const { data: coin, error: coinError } = await supabase
      .from("user_coins")
      .select("*")
      .eq("id", coinId)
      .single();

    if (coinError || !coin) {
      console.error("Error fetching coin:", coinError);
      return { success: false, error: "Failed to fetch coin details" };
    }

    const purchasePrice = coin.purchase_price;
    const shipping = shippingCost || 0;
    const fees = platformFees || 0;
    const profit = salePrice - purchasePrice - shipping - fees;
    const markupPercentage = purchasePrice > 0 ? (profit / purchasePrice) * 100 : 0;

    // Step 3: Update the coin to mark as sold and clear listing_id
    const { error: updateError } = await supabase
      .from("user_coins")
      .update({
        is_sold: true,
        listing_id: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", coinId);

    if (updateError) {
      console.error("Error updating coin:", updateError);
      return { success: false, error: "Failed to update coin status" };
    }

    // Step 4: Create sale record with new cost fields
    const { error: saleError } = await supabase
      .from("user_sales")
      .insert({
        user_id: user.id,
        coin_id: coinId,
        sku: coin.sku,
        coin_name: coin.coin_name,
        sale_date: saleDate,
        sale_price: salePrice,
        purchase_price: purchasePrice,
        shipping_cost: shipping,
        platform_fees: fees,
        profit: profit,
        markup_percentage: markupPercentage,
        buyer_id: buyerId,
        notes: notes ? `Platform: ${listing.platform}\n${notes}` : `Platform: ${listing.platform}`
      });

    if (saleError) {
      console.error("Error creating sale record:", saleError);
      return { success: false, error: "Failed to create sale record" };
    }

    // Step 5: Delete the listing
    const { error: deleteError } = await supabase
      .from("user_listings")
      .delete()
      .eq("id", listingId);

    if (deleteError) {
      console.error("Error deleting listing:", deleteError);
      return { success: false, error: "Failed to delete listing" };
    }

    console.log("Successfully marked listing as sold:", { coinId, salePrice, saleDate, shippingCost, platformFees });
    return { success: true };
  } catch (error: unknown) {
    console.error("Unexpected error marking listing as sold:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}