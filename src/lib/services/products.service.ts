/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import { PRODUCTS } from "@/data/products";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type VariationRow = Database["public"]["Tables"]["product_variations"]["Row"];
export type ImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type SizeRow = Database["public"]["Tables"]["product_sizes"]["Row"];

export type FullProductAdmin = ProductRow & {
  variations: (VariationRow & { images: ImageRow[]; sizes: SizeRow[] })[];
  category: { id: string; name: string; slug: string } | null;
};

// Tipos antigos para retrocompatibilidade
export type LegacyProduct = {
  id: string;
  nome: string;
  referencia: string;
  categoria: string;
  descricao: string;
  preco: number;
  imagem: string;
  destaque: boolean;
  maisVendido: boolean;
  tamanhos?: string[];
  tags?: string[];
  variacoes?: {
    cor: string;
    slug: string;
    hex: string;
    thumb: string;
    imagens: string[];
    tamanhos: string[];
  }[];
  precoPromocional?: number;
  composicao?: string;
  cuidados?: string;
  dicaCaimento?: string;
};

async function applyDynamicBadges(
  products: (Record<string, unknown> & { id: string; created_at: string })[],
) {
  if (!products || products.length === 0) return products;

  // 1. Dinâmica Lançamentos (Top 20 mais recentes)
  const sortedByDate = [...products].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const top20NewestIds = new Set(sortedByDate.slice(0, 20).map((p) => p.id));

  // 2. Dinâmica Mais Vendidos (Top 10 via nova RPC)
  let top10BestsellerIds = new Set<string>();

  try {
    const { data: rpcData, error } = await (supabase.rpc as any)("get_top_bestseller_ids");
    if (!error && Array.isArray(rpcData) && rpcData.length > 0) {
      top10BestsellerIds = new Set(rpcData.map((row: any) => row.product_id));
    }
  } catch (err) {
    console.error("Erro ao carregar mais vendidos via RPC:", err);
  }

  // Fallback para teste: se não houver dados de analytics, pega os 10 primeiros como mais vendidos
  if (top10BestsellerIds.size === 0 && products.length > 0) {
    const fallbackIds = products.slice(0, 10).map((p) => p.id);
    top10BestsellerIds = new Set(fallbackIds);
  }

  // 3. Aplica nas propriedades
  return products.map((p) => ({
    ...p,
    is_featured: top20NewestIds.has(p.id),
    is_bestseller: top10BestsellerIds.has(p.id),
  }));
}

type VariationData = {
  color_name: string;
  color_slug: string;
  hex_code?: string;
  images?: { is_main: boolean; url: string; display_order?: number }[];
  sizes?: { is_available: boolean; size: string }[];
};

// Conversor do banco para o modelo antigo do frontend (Fallback compatível)
const mapSupabaseToLegacy = (row: unknown): LegacyProduct => {
  const data = row as Record<string, unknown>;
  const defaultImage = "https://placehold.co/900x1200/f8f9fa/a1a1aa?text=Imagem+Pendente";

  // Extraindo imagens da primeira variação se existir
  const vars = (data.variations as VariationData[]) || [];
  let mainImage = defaultImage;

  if (vars.length > 0 && vars[0].images && vars[0].images.length > 0) {
    // Pega a principal ou a primeira
    const mainImgObj = vars[0].images.find((i) => i.is_main) || vars[0].images[0];
    mainImage = mainImgObj.url;
  }

  return {
    id: data.id as string,
    nome: data.name as string,
    referencia: data.sku as string,
    categoria: (data.category as { slug?: string })?.slug || "sem-categoria",
    descricao: (data.description as string) || (data.short_description as string) || "",
    preco: Number(data.price),
    precoPromocional: data.promotional_price ? Number(data.promotional_price) : undefined,
    imagem: mainImage,
    destaque: (data.is_featured as boolean) || false,
    maisVendido: (data.is_bestseller as boolean) || false,
    tamanhos:
      vars.length > 0 && vars[0].sizes
        ? vars[0].sizes.filter((s) => s.is_available).map((s) => s.size)
        : ["P", "M", "G"],
    composicao: data.composition as string | undefined,
    cuidados: data.care_instructions as string | undefined,
    dicaCaimento: data.fit_tip as string | undefined,
    variacoes: vars.map((v) => ({
      cor: v.color_name,
      slug: v.color_slug,
      hex: v.hex_code || "#000000",
      thumb:
        v.images && v.images.length > 0
          ? (v.images.find((i) => i.is_main) || v.images[0]).url
          : mainImage,
      imagens: v.images
        ? v.images
            .filter((i) => {
              if (vars.length > 1 && i.is_main) return false;
              return true;
            })
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((i) => i.url)
        : [],
      tamanhos: v.sizes ? v.sizes.filter((s) => s.is_available).map((s) => s.size) : [],
    })),
  };
};

export const getPublicProducts = async (categorySlug?: string): Promise<LegacyProduct[]> => {
  // ATENÇÃO: Esse método carrega TODO o catálogo de forma ineficiente.
  // Será substituído pelo getPublicProductsCardData com paginação real.
  try {
    const query = supabase
      .from("products")
      .select(
        `
        *,
        category:categories(id, name, slug),
        variations:product_variations(
          *,
          images:product_images(*),
          sizes:product_sizes(*)
        )
      `,
      )
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return [];

    const enrichedData = await applyDynamicBadges(data);

    const mapped = enrichedData.map(mapSupabaseToLegacy);
    if (categorySlug) {
      return mapped.filter((p) => p.categoria === categorySlug);
    }
    return mapped;
  } catch (error) {
    console.error("Erro buscando produtos:", error);
    return [];
  }
};

export const getPublicProductsCardData = async (
  categorySlug?: string,
  limit: number = 12,
  offset: number = 0,
): Promise<LegacyProduct[]> => {
  try {
    let query = supabase
      .from("products")
      .select(
        `
        id, name, slug, sku, price, promotional_price, is_featured, is_bestseller, created_at, category_id, status, display_order,
        category:categories!inner(id, name, slug),
        variations:product_variations(
          id, color_name, color_slug, hex_code, display_order,
          images:product_images(id, url, is_main, display_order),
          sizes:product_sizes(id, size, is_available, stock)
        )
      `,
      )
      .eq("status", "published")
      .eq("variations.active", true);

    if (categorySlug) {
      query = query.eq("categories.slug", categorySlug);
    }

    // Limit e range para paginação real
    query = query
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const enrichedData = await applyDynamicBadges(data as any);
    return enrichedData.map(mapSupabaseToLegacy);
  } catch (error) {
    console.error("Erro buscando produtos paginados:", error);
    return [];
  }
};

export const getPublicProductBySlug = async (slug: string): Promise<LegacyProduct | undefined> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(id, name, slug),
        variations:product_variations(
          *,
          images:product_images(*),
          sizes:product_sizes(*)
        )
      `,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) {
      return undefined;
    }

    return mapSupabaseToLegacy(data);
  } catch (error) {
    console.error("Erro buscando produto por slug:", error);
    return undefined;
  }
};

export const getPublicProductById = async (id: string): Promise<LegacyProduct | undefined> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(id, name, slug),
        variations:product_variations(
          *,
          images:product_images(*),
          sizes:product_sizes(*)
        )
      `,
      )
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (error || !data) {
      return undefined;
    }

    return mapSupabaseToLegacy(data);
  } catch (error) {
    console.error("Erro buscando produto por id:", error);
    return undefined;
  }
};

// ==========================================
// MÉTODOS DO ADMIN (Lidar com FullProductAdmin)
// ==========================================

export const getAdminProducts = async (): Promise<FullProductAdmin[]> => {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(id, name, slug),
      variations:product_variations(
        *,
        images:product_images(*),
        sizes:product_sizes(*)
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  const enrichedData = await applyDynamicBadges(data);
  return enrichedData as unknown as FullProductAdmin[];
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
};

// Importa mocks para o DB
export const migrateMocksToSupabase = async () => {
  if (!isSupabaseConfigured()) throw new Error("Supabase não configurado.");

  const { data: cats } = await supabase.from("categories").select("*");
  const catMap = new Map(cats?.map((c) => [c.slug, c.id]) || []);

  for (const mock of PRODUCTS) {
    const catId = catMap.get(mock.categoria);

    // Insere Produto
    const { data: product, error: pErr } = await supabase
      .from("products")
      .insert({
        name: mock.nome,
        slug:
          mock.nome
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") +
          "-" +
          Date.now(),
        sku: mock.referencia,
        category_id: catId || null,
        description: mock.descricao,
        short_description: mock.descricao.substring(0, 100),
        price: mock.preco,
        status: "published",
        is_bestseller: mock.maisVendido,
        is_featured: mock.destaque,
      })
      .select()
      .single();

    if (pErr) {
      console.error("Erro inserindo produto", mock.nome, pErr);
      continue;
    }

    // Insere Variações
    if (mock.variacoes && mock.variacoes.length > 0) {
      for (let i = 0; i < mock.variacoes.length; i++) {
        const v = mock.variacoes[i];
        const { data: variation, error: vErr } = await supabase
          .from("product_variations")
          .insert({
            product_id: product.id,
            color_name: v.cor,
            color_slug: v.slug,
            hex_code: v.hex,
            display_order: i,
          })
          .select()
          .single();

        if (vErr) continue;

        // Insere Imagens
        const allImgs = [v.thumb, ...v.imagens];
        const uniqueImgs = [...new Set(allImgs)].filter(Boolean);

        for (let j = 0; j < uniqueImgs.length; j++) {
          await supabase.from("product_images").insert({
            product_id: product.id,
            variation_id: variation.id,
            url: uniqueImgs[j],
            is_main: j === 0,
            display_order: j,
          });
        }

        // Insere Tamanhos
        const sizes = v.tamanhos || mock.tamanhos || ["P", "M", "G"];
        for (const s of sizes) {
          await supabase.from("product_sizes").insert({
            product_id: product.id,
            variation_id: variation.id,
            size: s,
            stock: 10,
            is_available: true,
          });
        }
      }
    } else {
      // Se não tem variação, cria uma padrão
      const { data: variation } = await supabase
        .from("product_variations")
        .insert({
          product_id: product.id,
          color_name: "Única",
          color_slug: "unica",
          hex_code: "#000000",
        })
        .select()
        .single();

      if (variation) {
        await supabase.from("product_images").insert({
          product_id: product.id,
          variation_id: variation.id,
          url: mock.imagem,
          is_main: true,
        });

        const sizes = mock.tamanhos || ["P", "M", "G"];
        for (const s of sizes) {
          await supabase.from("product_sizes").insert({
            product_id: product.id,
            variation_id: variation.id,
            size: s,
            stock: 10,
            is_available: true,
          });
        }
      }
    }
  }
};
