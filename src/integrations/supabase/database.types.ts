 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      buyers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coins_reference: {
        Row: {
          coin_name: string | null
          country_code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          diameter: number | null
          id: string
          image_url: string | null
          km_number: string
          metal: string
          numista_id: number | null
          obverse_image_url: string | null
          purity: number
          reverse_image_url: string | null
          sku: string
          updated_at: string | null
          weight: number
          weight_net: number | null
          year_issued: number | null
        }
        Insert: {
          coin_name?: string | null
          country_code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          diameter?: number | null
          id?: string
          image_url?: string | null
          km_number: string
          metal: string
          numista_id?: number | null
          obverse_image_url?: string | null
          purity: number
          reverse_image_url?: string | null
          sku: string
          updated_at?: string | null
          weight: number
          weight_net?: number | null
          year_issued?: number | null
        }
        Update: {
          coin_name?: string | null
          country_code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          diameter?: number | null
          id?: string
          image_url?: string | null
          km_number?: string
          metal?: string
          numista_id?: number | null
          obverse_image_url?: string | null
          purity?: number
          reverse_image_url?: string | null
          sku?: string
          updated_at?: string | null
          weight?: number
          weight_net?: number | null
          year_issued?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          gold_price_chf_per_gram: number | null
          id: string
          platinum_price_chf_per_gram: number | null
          prices_last_updated: string | null
          silver_price_chf_per_gram: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gold_price_chf_per_gram?: number | null
          id: string
          platinum_price_chf_per_gram?: number | null
          prices_last_updated?: string | null
          silver_price_chf_per_gram?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gold_price_chf_per_gram?: number | null
          id?: string
          platinum_price_chf_per_gram?: number | null
          prices_last_updated?: string | null
          silver_price_chf_per_gram?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spot_prices_cache: {
        Row: {
          created_at: string | null
          gold: number
          id: string
          platinum: number
          silver: number
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          gold: number
          id?: string
          platinum: number
          silver: number
          timestamp?: string
        }
        Update: {
          created_at?: string | null
          gold?: number
          id?: string
          platinum?: number
          silver?: number
          timestamp?: string
        }
        Relationships: []
      }
      user_coins: {
        Row: {
          coin_name: string | null
          country_code: string
          created_at: string | null
          grade: string
          id: string
          image_url: string | null
          is_sold: boolean | null
          listing_id: string | null
          mintmark: string | null
          notes: string | null
          obverse_image_url: string | null
          purchase_date: string
          purchase_price: number
          reference_coin_id: string
          reverse_image_url: string | null
          sku: string
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          coin_name?: string | null
          country_code: string
          created_at?: string | null
          grade: string
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          listing_id?: string | null
          mintmark?: string | null
          notes?: string | null
          obverse_image_url?: string | null
          purchase_date: string
          purchase_price: number
          reference_coin_id: string
          reverse_image_url?: string | null
          sku: string
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          coin_name?: string | null
          country_code?: string
          created_at?: string | null
          grade?: string
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          listing_id?: string | null
          mintmark?: string | null
          notes?: string | null
          obverse_image_url?: string | null
          purchase_date?: string
          purchase_price?: number
          reference_coin_id?: string
          reverse_image_url?: string | null
          sku?: string
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_coins_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "user_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coins_reference_coin_id_fkey"
            columns: ["reference_coin_id"]
            isOneToOne: false
            referencedRelation: "coins_reference"
            referencedColumns: ["id"]
          },
        ]
      }
      user_listings: {
        Row: {
          coin_id: string
          coin_name: string | null
          created_at: string | null
          current_bid: number | null
          expected_end_date: string | null
          id: string
          is_active: boolean | null
          listing_date: string
          notes: string | null
          platform: string
          reserve_price: number | null
          sku: string
          starting_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coin_id: string
          coin_name?: string | null
          created_at?: string | null
          current_bid?: number | null
          expected_end_date?: string | null
          id?: string
          is_active?: boolean | null
          listing_date: string
          notes?: string | null
          platform: string
          reserve_price?: number | null
          sku: string
          starting_price: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coin_id?: string
          coin_name?: string | null
          created_at?: string | null
          current_bid?: number | null
          expected_end_date?: string | null
          id?: string
          is_active?: boolean | null
          listing_date?: string
          notes?: string | null
          platform?: string
          reserve_price?: number | null
          sku?: string
          starting_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_listings_coin_id_fkey"
            columns: ["coin_id"]
            isOneToOne: false
            referencedRelation: "user_coins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sales: {
        Row: {
          buyer_id: string | null
          buyer_info: string | null
          coin_id: string
          coin_name: string | null
          created_at: string | null
          id: string
          markup_percentage: number
          net_profit: number | null
          notes: string | null
          platform_fees: number | null
          profit: number
          purchase_price: number
          sale_date: string
          sale_price: number
          shipping_cost: number | null
          sku: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          buyer_id?: string | null
          buyer_info?: string | null
          coin_id: string
          coin_name?: string | null
          created_at?: string | null
          id?: string
          markup_percentage: number
          net_profit?: number | null
          notes?: string | null
          platform_fees?: number | null
          profit: number
          purchase_price: number
          sale_date: string
          sale_price: number
          shipping_cost?: number | null
          sku?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          buyer_id?: string | null
          buyer_info?: string | null
          coin_id?: string
          coin_name?: string | null
          created_at?: string | null
          id?: string
          markup_percentage?: number
          net_profit?: number | null
          notes?: string | null
          platform_fees?: number | null
          profit?: number
          purchase_price?: number
          sale_date?: string
          sale_price?: number
          shipping_cost?: number | null
          sku?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sales_coin_id_fkey"
            columns: ["coin_id"]
            isOneToOne: false
            referencedRelation: "user_coins"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
