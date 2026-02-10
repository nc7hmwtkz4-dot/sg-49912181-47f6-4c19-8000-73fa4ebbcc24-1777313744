 
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
      coins_reference: {
        Row: {
          country_code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          diameter: number | null
          id: string
          image_url: string | null
          km_number: string
          metal: string
          name: string | null
          purity: number
          sku: string
          updated_at: string | null
          weight: number
        }
        Insert: {
          country_code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          diameter?: number | null
          id?: string
          image_url?: string | null
          km_number: string
          metal: string
          name?: string | null
          purity: number
          sku: string
          updated_at?: string | null
          weight: number
        }
        Update: {
          country_code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          diameter?: number | null
          id?: string
          image_url?: string | null
          km_number?: string
          metal?: string
          name?: string | null
          purity?: number
          sku?: string
          updated_at?: string | null
          weight?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_coins: {
        Row: {
          country_code: string
          created_at: string | null
          grade: string
          id: string
          image_url: string | null
          is_sold: boolean | null
          km_number: string
          metal: string
          mintmark: string | null
          notes: string | null
          purchase_date: string
          purchase_price: number
          purity: number
          reference_coin_id: string | null
          sku: string
          updated_at: string | null
          user_id: string
          weight: number
          year: number
        }
        Insert: {
          country_code: string
          created_at?: string | null
          grade: string
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          km_number: string
          metal: string
          mintmark?: string | null
          notes?: string | null
          purchase_date: string
          purchase_price: number
          purity: number
          reference_coin_id?: string | null
          sku: string
          updated_at?: string | null
          user_id: string
          weight: number
          year: number
        }
        Update: {
          country_code?: string
          created_at?: string | null
          grade?: string
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          km_number?: string
          metal?: string
          mintmark?: string | null
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          purity?: number
          reference_coin_id?: string | null
          sku?: string
          updated_at?: string | null
          user_id?: string
          weight?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_coins_reference_coin_id_fkey"
            columns: ["reference_coin_id"]
            isOneToOne: false
            referencedRelation: "coins_reference"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sales: {
        Row: {
          buyer_info: string | null
          coin_id: string
          created_at: string | null
          id: string
          markup_percentage: number
          notes: string | null
          profit: number
          purchase_price: number
          sale_date: string
          sale_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          buyer_info?: string | null
          coin_id: string
          created_at?: string | null
          id?: string
          markup_percentage: number
          notes?: string | null
          profit: number
          purchase_price: number
          sale_date: string
          sale_price: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          buyer_info?: string | null
          coin_id?: string
          created_at?: string | null
          id?: string
          markup_percentage?: number
          notes?: string | null
          profit?: number
          purchase_price?: number
          sale_date?: string
          sale_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
