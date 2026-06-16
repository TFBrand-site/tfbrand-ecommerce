import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Pegamos as variáveis de ambiente usando import.meta.env (padrão do Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Se não houver chaves, podemos exportar um cliente mock ou apenas lançar erro.
const hasKeys = supabaseUrl && supabaseAnonKey;

export const supabase = createClient<Database>(
  hasKeys ? supabaseUrl : "https://dummy.supabase.co",
  hasKeys ? supabaseAnonKey : "dummy-key",
);

export const isSupabaseConfigured = () => hasKeys;
