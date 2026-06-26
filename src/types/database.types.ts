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
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
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
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
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
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
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
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
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
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
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
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
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
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
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
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      leads: {
        Row: {
          id: string;
          customer_name: string | null;
          customer_phone: string | null;
          items: Json;
          subtotal: number;
          status: "iniciado" | "confirmado" | "cancelado";
          device_info: string | null;
          origin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          items: Json;
          subtotal: number;
          status?: "iniciado" | "confirmado" | "cancelado";
          device_info?: string | null;
          origin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          items?: Json;
          subtotal?: number;
          status?: "iniciado" | "confirmado" | "cancelado";
          device_info?: string | null;
          origin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          email: string | null;
          role: "admin" | "editor";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nome?: string | null;
          email?: string | null;
          role?: "admin" | "editor";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string | null;
          email?: string | null;
          role?: "admin" | "editor";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      audit_logs: {
        Row: {
          id: string;
          admin_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
    };
    Views: {
      product_colors: {
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
        Relationships: [];
      };
      product_size_stock: {
        Row: {
          id: string;
          product_id: string | null;
          variation_id: string | null;
          size: string;
          stock: number | null;
          is_available: boolean | null;
          created_at: string;
        };
        Relationships: [];
      };
      product_measurements: {
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
        Relationships: [];
      };
      product_care: {
        Row: {
          id: string;
          name: string;
          care_instructions: Json | null;
        };
        Relationships: [];
      };
      order_leads: {
        Row: {
          id: string;
          customer_name: string | null;
          customer_phone: string | null;
          items: Json;
          subtotal: number;
          status: "iniciado" | "confirmado" | "cancelado";
          device_info: string | null;
          origin: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
      product_metrics: {
        Row: {
          id: string;
          event_type: string;
          product_id: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Relationships: [];
      };
      store_config: {
        Row: {
          id: string;
          store_name: string | null;
          whatsapp_number: string | null;
          instagram_url: string | null;
          tech_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_order_lead_secure: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_items: Json;
          p_device_info: string;
          p_origin: string;
          p_obs: string;
        };
        Returns: Json;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_editor_or_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      product_status: "draft" | "published" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
