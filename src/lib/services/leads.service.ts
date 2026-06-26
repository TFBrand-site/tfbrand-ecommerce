import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type Lead = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any;
  subtotal: number;
  status: "iniciado" | "confirmado" | "cancelado";
  device_info: string | null;
  origin: string | null;
  created_at: string;
  updated_at: string;
};

export const getLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar leads:", error);
    return [];
  }
  return data as Lead[];
};

export const createLead = async (
  leadData: Database["public"]["Tables"]["leads"]["Insert"],
): Promise<Lead | null> => {
  const { data, error } = await supabase.from("leads").insert([leadData]).select().single();

  if (error) {
    console.error("Erro ao criar lead:", error.message, error.details, error.hint);
    throw new Error(`Falha ao salvar pedido: ${error.message}`);
  }
  return data as Lead;
};

export const updateLeadStatus = async (id: string, status: Lead["status"]): Promise<void> => {
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar lead:", error);
    throw error;
  }
};
