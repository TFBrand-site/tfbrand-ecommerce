export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          active: boolean | null;
          display_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          active?: boolean | null;
          display_order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          active?: boolean | null;
          display_order?: number | null;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sku: string;
          category_id: string | null;
          short_description: string | null;
          description: string | null;
          price: number;
          promotional_price: number | null;
          status: "draft" | "published" | "archived" | null;
          is_new: boolean | null;
          is_bestseller: boolean | null;
          is_featured: boolean | null;
          composition: string | null;
          care_instructions: Json | null;
          fit_tip: string | null;
          measurement_observation: string | null;
          display_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sku: string;
          category_id?: string | null;
          short_description?: string | null;
          description?: string | null;
          price: number;
          promotional_price?: number | null;
          status?: "draft" | "published" | "archived" | null;
          is_new?: boolean | null;
          is_bestseller?: boolean | null;
          is_featured?: boolean | null;
          composition?: string | null;
          care_instructions?: Json | null;
          fit_tip?: string | null;
          measurement_observation?: string | null;
          display_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          sku?: string;
          category_id?: string | null;
          short_description?: string | null;
          description?: string | null;
          price?: number;
          promotional_price?: number | null;
          status?: "draft" | "published" | "archived" | null;
          is_new?: boolean | null;
          is_bestseller?: boolean | null;
          is_featured?: boolean | null;
          composition?: string | null;
          care_instructions?: Json | null;
          fit_tip?: string | null;
          measurement_observation?: string | null;
          display_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variations: {
        Row: {
          id: string;
          product_id: string | null;
          color_name: string;
          color_slug: string;
          hex_code: string | null;
          display_order: number | null;
          active: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          color_name: string;
          color_slug: string;
          hex_code?: string | null;
          display_order?: number | null;
          active?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          color_name?: string;
          color_slug?: string;
          hex_code?: string | null;
          display_order?: number | null;
          active?: boolean | null;
          created_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string | null;
          variation_id: string | null;
          url: string;
          alt_text: string | null;
          is_main: boolean | null;
          display_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          variation_id?: string | null;
          url: string;
          alt_text?: string | null;
          is_main?: boolean | null;
          display_order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          variation_id?: string | null;
          url?: string;
          alt_text?: string | null;
          is_main?: boolean | null;
          display_order?: number | null;
          created_at?: string;
        };
      };
      product_sizes: {
        Row: {
          id: string;
          product_id: string | null;
          variation_id: string | null;
          size: string;
          stock: number | null;
          is_available: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          variation_id?: string | null;
          size: string;
          stock?: number | null;
          is_available?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          variation_id?: string | null;
          size?: string;
          stock?: number | null;
          is_available?: boolean | null;
          created_at?: string;
        };
      };
      size_guides: {
        Row: {
          id: string;
          product_id: string | null;
          size_name: string;
          numbering: string | null;
          bust: string | null;
          waist: string | null;
          hip: string | null;
          length: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          size_name: string;
          numbering?: string | null;
          bust?: string | null;
          waist?: string | null;
          hip?: string | null;
          length?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          size_name?: string;
          numbering?: string | null;
          bust?: string | null;
          waist?: string | null;
          hip?: string | null;
          length?: string | null;
          created_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: string;
          product_id: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          product_id?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          product_id?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      store_settings: {
        Row: {
          id: string;
          store_name: string | null;
          whatsapp_number: string | null;
          instagram_url: string | null;
          tech_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_name?: string | null;
          whatsapp_number?: string | null;
          instagram_url?: string | null;
          tech_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_name?: string | null;
          whatsapp_number?: string | null;
          instagram_url?: string | null;
          tech_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      product_status: "draft" | "published" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
