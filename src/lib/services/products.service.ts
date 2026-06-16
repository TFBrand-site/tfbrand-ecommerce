import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { PRODUCTS, type Product as LegacyProduct } from "@/data/products";
import type { Database } from "@/types/database.types";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type VariationRow = Database["public"]["Tables"]["product_variations"]["Row"];
export type ImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type SizeRow = Database["public"]["Tables"]["product_sizes"]["Row"];

export type FullProductAdmin = ProductRow & {
  variations: (VariationRow & { images: ImageRow[]; sizes: SizeRow[] })[];
  category: { id: string; name: string; slug: string } | null;
};

// Conversor do banco para o modelo antigo do frontend (Fallback compatível)
const mapSupabaseToLegacy = (row: any): LegacyProduct => {
  const defaultImage =
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80";

  // Extraindo imagens da primeira variação se existir
  const vars = row.variations || [];
  let mainImage = defaultImage;
  let allImages: string[] = [];

  if (vars.length > 0 && vars[0].images && vars[0].images.length > 0) {
    // Pega a principal ou a primeira
    const mainImgObj = vars[0].images.find((i: any) => i.is_main) || vars[0].images[0];
    mainImage = mainImgObj.url;
  }

  return {
    id: row.id,
    nome: row.name,
    referencia: row.sku,
    categoria: row.category?.slug || "sem-categoria",
    descricao: row.description || row.short_description || "",
    preco: Number(row.price),
    imagem: mainImage,
    destaque: row.is_featured || false,
    maisVendido: row.is_bestseller || false,
    tamanhos:
      vars.length > 0 && vars[0].sizes
        ? vars[0].sizes.filter((s: any) => s.is_available).map((s: any) => s.size)
        : ["P", "M", "G"],
    variacoes: vars.map((v: any) => ({
      cor: v.color_name,
      slug: v.color_slug,
      hex: v.hex_code || "#000000",
      thumb:
        v.images && v.images.length > 0
          ? (v.images.find((i: any) => i.is_main) || v.images[0]).url
          : mainImage,
      imagens: v.images
        ? v.images
            .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
            .map((i: any) => i.url)
        : [],
    })),
  };
};

export const getPublicProducts = async (categorySlug?: string): Promise<LegacyProduct[]> => {
  if (!isSupabaseConfigured()) {
    return categorySlug ? PRODUCTS.filter((p) => p.categoria === categorySlug) : PRODUCTS;
  }

  try {
    let query = supabase
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
    if (!data || data.length === 0) return PRODUCTS; // Fallback to mock if db is empty

    const mapped = data.map(mapSupabaseToLegacy);
    if (categorySlug) {
      return mapped.filter((p) => p.categoria === categorySlug);
    }
    return mapped;
  } catch (error) {
    console.error("Failed to fetch public products from Supabase, falling back to mock:", error);
    return categorySlug ? PRODUCTS.filter((p) => p.categoria === categorySlug) : PRODUCTS;
  }
};

export const getPublicProductBySlug = async (slug: string): Promise<LegacyProduct | undefined> => {
  if (!isSupabaseConfigured()) {
    return PRODUCTS.find(
      (p) => p.id === slug || p.nome.toLowerCase().replace(/\s+/g, "-") === slug,
    ); // Mock id or name approximation
  }

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
      return PRODUCTS.find((p) => p.id === slug);
    }

    return mapSupabaseToLegacy(data);
  } catch (error) {
    return PRODUCTS.find((p) => p.id === slug);
  }
};

// ==========================================
// MÉTODOS DO ADMIN (Lidar com FullProductAdmin)
// ==========================================

export const getAdminProducts = async (): Promise<FullProductAdmin[]> => {
  if (!isSupabaseConfigured()) return [];

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
  return data as any;
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
