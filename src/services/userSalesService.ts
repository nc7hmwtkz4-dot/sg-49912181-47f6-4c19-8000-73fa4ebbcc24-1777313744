import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SaleInsert = Database["public"]["Tables"]["user_sales"]["Insert"];
type SaleUpdate = Database["public"]["Tables"]["user_sales"]["Update"];
type BuyerInsert = Database["public"]["Tables"]["buyers"]["Insert"];
type BuyerUpdate = Database["public"]["Tables"]["buyers"]["Update"];

export const userSalesService = {
  getUserSales: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: { message: "Not authenticated" } };
    }

    const { data, error } = await supabase
      .from("user_sales")
      .select(`
        *,
        buyer:buyers(*)
      `)
      .eq("user_id", user.id)
      .order("sale_date", { ascending: false });

    console.log("Sales with buyers:", { data, error });
    return { data, error };
  },

  addSale: async (sale: Omit<SaleInsert, "id" | "user_id" | "created_at">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: { message: "Not authenticated" } };
    }

    const { data, error } = await supabase
      .from("user_sales")
      .insert({
        ...sale,
        user_id: user.id
      })
      .select()
      .single();

    console.log("Add sale:", { data, error });
    return { data, error };
  },

  updateSale: async (id: string, updates: SaleUpdate) => {
    const { data, error } = await supabase
      .from("user_sales")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    console.log("Update sale:", { data, error });
    return { data, error };
  },

  // Buyer management functions
  getBuyers: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: { message: "Not authenticated" } };
    }

    const { data, error } = await supabase
      .from("buyers")
      .select("*")
      .eq("user_id", user.id)
      .order("last_name", { ascending: true });

    console.log("Get buyers:", { data, error });
    return { data, error };
  },

  addBuyer: async (buyer: Omit<BuyerInsert, "id" | "user_id" | "created_at">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: { message: "Not authenticated" } };
    }

    const { data, error } = await supabase
      .from("buyers")
      .insert({
        ...buyer,
        user_id: user.id
      })
      .select()
      .single();

    console.log("Add buyer:", { data, error });
    return { data, error };
  },

  updateBuyer: async (id: string, updates: BuyerUpdate) => {
    const { data, error } = await supabase
      .from("buyers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    console.log("Update buyer:", { data, error });
    return { data, error };
  },

  deleteBuyer: async (id: string) => {
    const { error } = await supabase
      .from("buyers")
      .delete()
      .eq("id", id);

    console.log("Delete buyer:", { error });
    return { error };
  }
};