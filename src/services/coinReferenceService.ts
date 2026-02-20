import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CoinReferenceInsert = Database["public"]["Tables"]["coins_reference"]["Insert"];

export const coinReferenceService = {
  /**
   * Search for reference coins by SKU, name, or KM number
   */
  searchReferences: async (searchTerm: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: [], error: null };
      }

      const searchPattern = `%${searchTerm}%`;
      
      const { data, error } = await supabase
        .from("coins_reference")
        .select("*")
        .or(`sku.ilike.${searchPattern},coin_name.ilike.${searchPattern},km_number.ilike.${searchPattern}`)
        .order("coin_name");

      console.log("Search results:", { searchTerm, data, error });
      
      return { data, error };
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