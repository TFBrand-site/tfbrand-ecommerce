import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

// Mock de Categorias para caso não haja Supabase configurado
const MOCK_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Vestidos",
    slug: "vestidos",
    description: null,
    active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Croppeds",
    slug: "croppeds",
    description: null,
    active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Conjuntos",
    slug: "conjuntos",
    description: null,
    active: true,
    display_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Saias",
    slug: "saias",
    description: null,
    active: true,
    display_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Blusas",
    slug: "blusas",
    description: null,
    active: true,
    display_order: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Calças",
    slug: "calcas",
    description: null,
    active: true,
    display_order: 6,
    created_at: new Date().toISOString(),
  },
];

export const getCategories = async (onlyActive = false): Promise<Category[]> => {
  let query = supabase.from("categories").select("*").order("display_order", { ascending: true });
  if (onlyActive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).single();
  if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows returned"
  return data;
};

export const createCategory = async (category: CategoryInsert): Promise<Category> => {
  if (!isSupabaseConfigured()) throw new Error("Supabase não configurado para salvar categorias.");

  const { data, error } = await supabase.from("categories").insert([category]).select().single();
  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, category: CategoryUpdate): Promise<Category> => {
  if (!isSupabaseConfigured())
    throw new Error("Supabase não configurado para atualizar categorias.");

  const { data, error } = await supabase
    .from("categories")
    .update(category)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
  return true;
};

export const updateCategoryOrders = async (
  updates: { id: string; display_order: number }[],
): Promise<void> => {
  // O Supabase tem um método 'upsert' que pode fazer atualizações em massa
  // se a primary key estiver presente. Como temos o id, vai atualizar.
  const { error } = await supabase
    .from("categories")
    .upsert(updates as unknown as CategoryInsert[], { onConflict: "id" });
  if (error) throw error;
};
