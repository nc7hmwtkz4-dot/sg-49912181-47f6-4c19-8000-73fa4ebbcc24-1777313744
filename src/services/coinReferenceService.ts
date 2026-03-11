import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CoinReferenceRow = Database["public"]["Tables"]["coins_reference"]["Row"];
type CoinReferenceInsert = Database["public"]["Tables"]["coins_reference"]["Insert"];

export const coinReferenceService = {
  /**
   * Search for reference coins by SKU, name, or KM number
   */
  searchReferences: async (searchTerm: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return { data: null, error: new Error("Not authenticated") };
      }

      // Search in three places:
      // 1. Official reference table
      // 2. User's existing collection SKUs
      // 3. User's existing sales SKUs
      
      const { data: refData, error: refError } = await supabase
        .from("coins_reference")
        .select("*")
        .or(`sku.ilike.%${searchTerm}%,coin_name.ilike.%${searchTerm}%,km_number.ilike.%${searchTerm}%,country_code.ilike.%${searchTerm}%`)
        .order("sku")
        .limit(50);

      // Get unique SKUs from user's coins
      const { data: userCoinsData } = await supabase
        .from("user_coins")
        .select("sku, coin_name")
        .eq("user_id", user.data.user.id)
        .ilike("sku", `%${searchTerm}%`)
        .limit(50);

      // Get unique SKUs from user's sales
      const { data: userSalesData } = await supabase
        .from("user_sales")
        .select("sku")
        .eq("user_id", user.data.user.id)
        .ilike("sku", `%${searchTerm}%`)
        .limit(50);

      // Combine and deduplicate results
      const combinedResults: CoinReferenceRow[] = [];
      const seenSKUs = new Set<string>();

      // Add official references first
      if (refData) {
        refData.forEach(coin => {
          if (!seenSKUs.has(coin.sku)) {
            combinedResults.push(coin);
            seenSKUs.add(coin.sku);
          }
        });
      }

      // Add user's coins (create reference-like objects)
      if (userCoinsData) {
        userCoinsData.forEach(coin => {
          if (coin.sku && !seenSKUs.has(coin.sku)) {
            combinedResults.push({
              sku: coin.sku,
              coin_name: coin.coin_name || `Coin ${coin.sku}`,
              country_code: null,
              km_number: null,
              denomination: null,
              year: null,
              metal_content: null,
              metal_purity: null,
              weight: null,
              created_at: new Date().toISOString()
            } as unknown as CoinReferenceRow);
            seenSKUs.add(coin.sku);
          }
        });
      }

      // Add unique SKUs from sales (minimal info)
      if (userSalesData) {
        userSalesData.forEach(sale => {
          if (sale.sku && !seenSKUs.has(sale.sku)) {
            combinedResults.push({
              sku: sale.sku,
              coin_name: `Coin ${sale.sku}`,
              country_code: null,
              km_number: null,
              denomination: null,
              year: null,
              metal_content: null,
              metal_purity: null,
              weight: null,
              created_at: new Date().toISOString()
            } as unknown as CoinReferenceRow);
            seenSKUs.add(sale.sku);
          }
        });
      }

      // Sort results by SKU
      combinedResults.sort((a, b) => a.sku.localeCompare(b.sku));

      return { data: combinedResults, error: refError };
    } catch (error) {
      console.error("Error searching reference coins:", error);
      return { data: null, error };
    }
  },

  /**
   * Get a reference coin by SKU
   */
  getReferenceBySKU: async (sku: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await supabase
        .from("coins_reference")
        .select("*")
        .eq("sku", sku)
        .single();

      return { data, error };
    } catch (error) {
      console.error("Error getting reference coin:", error);
      return { data: null, error };
    }
  },

  /**
   * Create a new reference coin
   */
  createReference: async (reference: CoinReferenceInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await supabase
        .from("coins_reference")
        .insert(reference)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error("Error creating reference coin:", error);
      return { data: null, error };
    }
  },

  /**
   * Update a reference coin
   */
  updateReference: async (sku: string, updates: Partial<CoinReferenceInsert>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await supabase
        .from("coins_reference")
        .update(updates)
        .eq("sku", sku)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error("Error updating reference coin:", error);
      return { data: null, error };
    }
  },

  /**
   * Get all reference coins
   */
  getAllReferences: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from("coins_reference")
        .select("*")
        .order("coin_name");

      return { data, error };
    } catch (error) {
      console.error("Error getting all reference coins:", error);
      return { data: null, error };
    }
  }
};