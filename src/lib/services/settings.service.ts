import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];
export type StoreSettingsUpdate = Database["public"]["Tables"]["store_settings"]["Update"];

const DEFAULT_SETTINGS: StoreSettings = {
  id: "mock-id",
  store_name: "TFBrand",
  whatsapp_number: import.meta.env.VITE_WHATSAPP_NUMBER || "5511999999999",
  instagram_url: import.meta.env.VITE_INSTAGRAM_URL || "https://instagram.com/tfbrand",
  tech_email: "tfbrand.tech@admin.com",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const getStoreSettings = async (): Promise<StoreSettings> => {
  if (!isSupabaseConfigured()) {
    return DEFAULT_SETTINGS;
  }

  const { data, error } = await supabase.from("store_settings").select("*").single();

  if (error) {
    if (error.code === "PGRST116") {
      // Se não existe, podemos inserir o padrão e retornar
      const { data: newData, error: insertError } = await supabase
        .from("store_settings")
        .insert([{ store_name: "TFBrand" }])
        .select()
        .single();

      if (!insertError && newData) return newData;
    }
    console.error("Erro ao carregar configurações:", error);
    return DEFAULT_SETTINGS;
  }

  if (data && !data.tech_email) {
    data.tech_email = "tfbrand.tech@admin.com";
  }

  return data;
};

export const updateStoreSettings = async (
  settings: StoreSettingsUpdate,
): Promise<StoreSettings> => {
  if (!isSupabaseConfigured()) throw new Error("Supabase não configurado.");

  const { data, error } = await supabase
    .from("store_settings")
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq("store_name", settings.store_name || "TFBrand") // Poderíamos usar o ID se soubermos, mas store_name é seguro se só tiver 1
    .select()
    .single();

  if (error) {
    // Tenta atualizar a primeira linha encontrada
    const { data: anyData, error: anyError } = await supabase
      .from("store_settings")
      .select("id")
      .limit(1)
      .single();
    if (anyData && !anyError) {
      const { data: updated, error: updateErr } = await supabase
        .from("store_settings")
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq("id", anyData.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      return updated;
    }
    throw error;
  }

  return data;
};
