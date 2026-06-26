import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import WebSocket from "ws";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== "undefined"
    ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    : undefined);

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  (typeof process !== "undefined"
    ? process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY
    : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltam variáveis de ambiente do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_KEY)",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: typeof window === "undefined" ? (WebSocket as any) : undefined,
  },
});

export const isSupabaseConfigured = () => !!(supabaseUrl && supabaseAnonKey);
