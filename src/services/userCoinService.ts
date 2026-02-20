import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserCoin = Database["public"]["Tables"]["user_coins"]["Row"];
type UserCoinInsert = Database["public"]["Tables"]["user_coins"]["Insert"];
type UserCoinUpdate = Database["public"]["Tables"]["user_coins"]["Update"];

export const userCoinService = {
  /**
   * Get all coins for the current user
   */
  async getUserCoins(): Promise<{ data: UserCoin[] | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from("user_coins")
        .select("*")
        .eq("user_id", user.id)
        .order("sku", { ascending: true });

      if (error) {
        console.error("Error fetching user coins:", error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("Unexpected error fetching user coins:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Add a new coin to user's collection
   */
  async addUserCoin(coin: Omit<UserCoinInsert, "user_id" | "id" | "created_at" | "updated_at">): Promise<{ data: UserCoin | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await supabase
        .from("user_coins")
        .insert({
          ...coin,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding user coin:", error);
        return { data: null, error: new Error(error.message) };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Unexpected error adding user coin:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Update a coin in user's collection
   */
  async updateUserCoin(id: string, updates: UserCoinUpdate): Promise<{ data: UserCoin | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from("user_coins")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user coin:", error);
        return { data: null, error: new Error(error.message) };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Unexpected error updating user coin:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Delete a coin from user's collection
   */
  async deleteUserCoin(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from("user_coins")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting user coin:", error);
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error deleting user coin:", err);
      return { error: err as Error };
    }
  },

  /**
   * Get coins by SKU for the current user
   */
  async getCoinsBySku(sku: string): Promise<{ data: UserCoin[] | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await supabase
        .from("user_coins")
        .select("*")
        .eq("user_id", user.id)
        .eq("sku", sku)
        .order("year", { ascending: true });

      if (error) {
        console.error("Error fetching coins by SKU:", error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("Unexpected error fetching coins by SKU:", err);
      return { data: null, error: err as Error };
    }
  }
};