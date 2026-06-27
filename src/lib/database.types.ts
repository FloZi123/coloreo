export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      app_admins: {
        Row: { created_at: string; email: string }
        Insert: { created_at?: string; email: string }
        Update: { created_at?: string; email?: string }
        Relationships: []
      }
      book_generation_queue: {
        Row: {
          category_id: string | null
          created_at: string
          generated_book_id: string | null
          id: string
          rationale: string | null
          status: Database["public"]["Enums"]["gen_status"]
          suggested_title_de: string
          suggested_title_en: string
          trigger_data: Json
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          generated_book_id?: string | null
          id?: string
          rationale?: string | null
          status?: Database["public"]["Enums"]["gen_status"]
          suggested_title_de: string
          suggested_title_en: string
          trigger_data?: Json
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          generated_book_id?: string | null
          id?: string
          rationale?: string | null
          status?: Database["public"]["Enums"]["gen_status"]
          suggested_title_de?: string
          suggested_title_en?: string
          trigger_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          audience: Database["public"]["Enums"]["audience"]
          category_id: string | null
          cover_url: string | null
          created_at: string
          description_de: string | null
          description_en: string | null
          i18n: Json
          id: string
          is_featured: boolean
          page_count: number
          pdf_path: string | null
          preview_urls: Json
          price_cents: number
          sales_count: number
          slug: string
          source: Database["public"]["Enums"]["content_source"]
          status: Database["public"]["Enums"]["book_status"]
          tags: string[]
          title_de: string
          title_en: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience"]
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          i18n?: Json
          id?: string
          is_featured?: boolean
          page_count?: number
          pdf_path?: string | null
          preview_urls?: Json
          price_cents?: number
          sales_count?: number
          slug: string
          source?: Database["public"]["Enums"]["content_source"]
          status?: Database["public"]["Enums"]["book_status"]
          tags?: string[]
          title_de: string
          title_en: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["books"]["Insert"]>
        Relationships: []
      }
      bundle_items: {
        Row: { book_id: string; bundle_id: string }
        Insert: { book_id: string; bundle_id: string }
        Update: { book_id?: string; bundle_id?: string }
        Relationships: []
      }
      bundles: {
        Row: {
          cover_url: string | null
          created_at: string
          description_de: string | null
          description_en: string | null
          i18n: Json
          id: string
          is_active: boolean
          price_cents: number | null
          slug: string
          sort_order: number
          title_de: string
          title_en: string
          type: Database["public"]["Enums"]["bundle_type"]
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          i18n?: Json
          id?: string
          is_active?: boolean
          price_cents?: number | null
          slug: string
          sort_order?: number
          title_de: string
          title_en: string
          type?: Database["public"]["Enums"]["bundle_type"]
        }
        Update: Partial<Database["public"]["Tables"]["bundles"]["Insert"]>
        Relationships: []
      }
      worlds: {
        Row: { id: string; slug: string; name_de: string; name_en: string; description_de: string | null; description_en: string | null; i18n: Json; emoji: string | null; accent: string | null; sort_order: number; is_active: boolean; created_at: string }
        Insert: { id?: string; slug: string; name_de: string; name_en: string; description_de?: string | null; description_en?: string | null; i18n?: Json; emoji?: string | null; accent?: string | null; sort_order?: number; is_active?: boolean; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["worlds"]["Insert"]>
        Relationships: []
      }
      categories: {
        Row: {
          audience: Database["public"]["Enums"]["audience"]
          created_at: string
          description_de: string | null
          description_en: string | null
          i18n: Json
          emoji: string | null
          hero_image: string | null
          id: string
          is_active: boolean
          name_de: string
          name_en: string
          slug: string
          sort_order: number
          world_id: string | null
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience"]
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          i18n?: Json
          emoji?: string | null
          hero_image?: string | null
          id?: string
          is_active?: boolean
          name_de: string
          name_en: string
          slug: string
          sort_order?: number
          world_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>
        Relationships: []
      }
      chat_conversations: {
        Row: { created_at: string; customer_email: string | null; id: string; locale: string; session_id: string }
        Insert: { created_at?: string; customer_email?: string | null; id?: string; locale?: string; session_id: string }
        Update: Partial<Database["public"]["Tables"]["chat_conversations"]["Insert"]>
        Relationships: []
      }
      chat_messages: {
        Row: { content: string; conversation_id: string; created_at: string; id: string; role: string }
        Insert: { content: string; conversation_id: string; created_at?: string; id?: string; role: string }
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          min_order_cents: number
          redeemed_count: number
          starts_at: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_order_cents?: number
          redeemed_count?: number
          starts_at?: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          value: number
        }
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>
        Relationships: []
      }
      customers: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          locale: string
          marketing_opt_in: boolean
          name: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          locale?: string
          marketing_opt_in?: boolean
          name?: string | null
          stripe_customer_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>
        Relationships: []
      }
      downloads: {
        Row: {
          book_id: string
          created_at: string
          customer_email: string
          download_count: number
          expires_at: string
          id: string
          max_downloads: number
          order_id: string
          token: string
          watermarked_path: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          customer_email: string
          download_count?: number
          expires_at?: string
          id?: string
          max_downloads?: number
          order_id: string
          token: string
          watermarked_path?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["downloads"]["Insert"]>
        Relationships: []
      }
      leads: {
        Row: {
          confirm_token: string | null
          created_at: string
          email: string
          freebie_book_id: string | null
          id: string
          locale: string
          opt_in_confirmed: boolean
          source: Database["public"]["Enums"]["lead_source"]
        }
        Insert: {
          confirm_token?: string | null
          created_at?: string
          email: string
          freebie_book_id?: string | null
          id?: string
          locale?: string
          opt_in_confirmed?: boolean
          source?: Database["public"]["Enums"]["lead_source"]
        }
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>
        Relationships: []
      }
      order_items: {
        Row: {
          book_id: string | null
          bundle_id: string | null
          id: string
          line_total_cents: number
          order_id: string
          quantity: number
          title_snapshot: string
          unit_price_cents: number
        }
        Insert: {
          book_id?: string | null
          bundle_id?: string | null
          id?: string
          line_total_cents: number
          order_id: string
          quantity?: number
          title_snapshot: string
          unit_price_cents: number
        }
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>
        Relationships: []
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_id: string | null
          discount_cents: number
          id: string
          locale: string
          order_number: string
          paid_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          subtotal_cents: number
          total_cents: number
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_id?: string | null
          discount_cents?: number
          id?: string
          locale?: string
          order_number: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number
          total_cents?: number
        }
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>
        Relationships: []
      }
      pricing_tiers: {
        Row: { discount_percent: number; id: string; is_active: boolean; min_quantity: number }
        Insert: { discount_percent: number; id?: string; is_active?: boolean; min_quantity: number }
        Update: Partial<Database["public"]["Tables"]["pricing_tiers"]["Insert"]>
        Relationships: []
      }
      site_settings: {
        Row: { key: string; updated_at: string; value: Json }
        Insert: { key: string; updated_at?: string; value: Json }
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>
        Relationships: []
      }
      support_tickets: {
        Row: {
          conversation_id: string | null
          created_at: string
          customer_email: string | null
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string | null
          summary: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          customer_email?: string | null
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string | null
          summary?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Insert"]>
        Relationships: []
      }
      reviews: {
        Row: { id: string; book_id: string; rating: number; author_name: string; body: string | null; is_approved: boolean; created_at: string }
        Insert: { id?: string; book_id: string; rating: number; author_name: string; body?: string | null; is_approved?: boolean; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>
        Relationships: []
      }
    }
    Views: {
      book_ratings: {
        Row: { book_id: string | null; avg_rating: number | null; review_count: number | null }
        Relationships: []
      }
    }
    Functions: {
      validate_coupon: {
        Args: { p_code: string }
        Returns: {
          code: string
          type: Database["public"]["Enums"]["coupon_type"]
          value: number
          min_order_cents: number
        }[]
      }
      increment_book_sales: {
        Args: { p_id: string; p_qty: number }
        Returns: undefined
      }
      redeem_coupon: {
        Args: { p_code: string }
        Returns: undefined
      }
    }
    Enums: {
      audience: "adult" | "kids" | "all"
      book_status: "draft" | "published" | "archived"
      bundle_type: "curated" | "quantity" | "byo"
      content_source: "manual" | "ai_generated"
      coupon_type: "percent" | "fixed"
      gen_status: "suggested" | "generating" | "draft_ready" | "approved" | "rejected"
      lead_source: "freebie" | "newsletter" | "checkout"
      order_status: "pending" | "paid" | "refunded" | "failed"
      ticket_status: "open" | "resolved"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
