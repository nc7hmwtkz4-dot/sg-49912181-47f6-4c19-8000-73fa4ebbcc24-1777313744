import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserSale = Database["public"]["Tables"]["user_sales"]["Row"];
type UserSaleInsert = Database["public"]["Tables"]["user_sales"]["Insert"];

export const userSalesService = {
  /**
   * Get all sales for the current user
   */
  async getUserSales(): Promise<{ data: UserSale[] | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await supabase
        .from("user_sales")
        .select("*")
        .eq("user_id", user.id)
        .order("sale_date", { ascending: false });

      if (error) {
        console.error("Error fetching user sales:", error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("Unexpected error fetching user sales:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Record a new sale
   */
  async addSale(sale: Omit<UserSaleInsert, "user_id" | "id" | "created_at">): Promise<{ data: UserSale | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await supabase
        .from("user_sales")
        .insert({
          ...sale,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding sale:", error);
        return { data: null, error: new Error(error.message) };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Unexpected error adding sale:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Delete a sale record
   */
  async deleteSale(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from("user_sales")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting sale:", error);
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error deleting sale:", err);
      return { error: err as Error };
    }
  }
};