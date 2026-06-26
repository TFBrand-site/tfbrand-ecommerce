/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPublicProducts, type LegacyProduct, type FullProductAdmin } from "./products.service";
import { supabase } from "@/lib/supabase";

// ==========================================
// UTILITÁRIOS E NORMALIZAÇÃO
// ==========================================

export function normalizeSearchText(text?: string | null): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ") // Remove pontuação e caracteres especiais, substituindo por espaço
    .replace(/\s+/g, " ") // Remove espaços múltiplos
    .trim();
}

// Dicionário de Sinônimos focado em moda
const SYNONYMS: Record<string, string[]> = {
  calca: ["pantalona", "legging", "jeans", "alfaiataria", "wide leg"],
  pantalona: ["calca pantalona", "pantalona"],
  jaqueta: ["jaqueta jeans", "jaqueta bomber", "jaqueta puffer", "jaqueta couro", "casaco"],
  blusao: ["blusao", "casaco", "moletom"],
  blusa: ["blusinha", "tshirt", "camiseta", "tricot"],
  blusinha: ["blusa", "tshirt"],
  vestido: [
    "vestido",
    "vest",
    "vestidinho",
    "vestido longo",
    "vestido midi",
    "tubinho",
    "vestido festa",
  ],
  "vestido festa": ["vestido"],
  vest: ["vestido"],
  cropped: ["cropped", "cropp", "top"],
  cropp: ["cropped"],
  conjunto: ["conjunto", "conj", "conjunto alfaiataria", "conjunto premium"],
  conj: ["conjunto"],
  macacao: ["macacao", "macac", "jardineira", "macaquinho"],
  macac: ["macacao"],
  macaquinho: ["macacao", "macaquinho"],
  casaco: ["jaqueta", "casaco", "blusao"],
  frio: ["casaco", "jaqueta", "blusao"],
  inverno: ["casaco", "jaqueta", "blusao", "look inverno"],
  "look elegante": ["vestido", "conjunto", "saia", "alfaiataria"],
  "look casual": ["blusa", "calca", "cropped", "jeans"],
  saia: ["saia midi", "saia alfaiataria", "saia cargo"],
};

export function expandQueryWithSynonyms(query: string): string[] {
  const words = query.split(" ");
  const expandedTerms = new Set<string>();
  expandedTerms.add(query); // Adiciona a query inteira

  if (SYNONYMS[query]) {
    SYNONYMS[query].forEach((syn) => expandedTerms.add(syn));
  }

  words.forEach((word) => {
    expandedTerms.add(word);
    if (SYNONYMS[word]) {
      SYNONYMS[word].forEach((syn) => expandedTerms.add(syn));
    }
  });

  return Array.from(expandedTerms);
}

// ==========================================
// CÁLCULO DE RELEVÂNCIA (RANKING)
// ==========================================

function calculateRelevance(
  product: LegacyProduct | FullProductAdmin,
  query: string,
  expandedTerms: string[],
): number {
  let score = 0;

  const isLegacy = "nome" in product;
  const name = isLegacy ? product.nome : (product as FullProductAdmin).name;
  const sku = isLegacy ? product.referencia : (product as FullProductAdmin).sku;
  const category = isLegacy
    ? product.categoria
    : (product as FullProductAdmin).category?.name || "";
  const desc = isLegacy ? product.descricao : (product as FullProductAdmin).description || "";
  const composition = isLegacy
    ? product.composicao || ""
    : (product as FullProductAdmin).composition || "";

  const colors: string[] = [];
  const sizes: string[] = [];

  if (isLegacy) {
    const leg = product as LegacyProduct;
    if (leg.variacoes) {
      leg.variacoes.forEach((v) => {
        colors.push(v.cor);
        if (v.tamanhos) sizes.push(...v.tamanhos);
      });
    }
    if (leg.tamanhos) sizes.push(...leg.tamanhos);
  } else {
    const full = product as FullProductAdmin;
    if (full.variations) {
      full.variations.forEach((v) => {
        colors.push(v.color_name);
        if (v.sizes) sizes.push(...v.sizes.map((s) => s.size));
      });
    }
  }

  const normQuery = normalizeSearchText(query);
  const normName = normalizeSearchText(name);
  const normSku = normalizeSearchText(sku);
  const normCategory = normalizeSearchText(category);
  const normDesc = normalizeSearchText(desc);
  const normComposition = normalizeSearchText(composition);

  const normColors = colors.map(normalizeSearchText).join(" ");
  const normSizes = sizes.map(normalizeSearchText).join(" ");

  const cleanSku = normSku.replace(/^ref\s*/, "").replace(/[-\s]/g, "");
  const cleanQuery = normQuery.replace(/^ref\s*/, "").replace(/[-\s]/g, "");

  if (cleanSku === cleanQuery && cleanSku.length > 1) {
    score += 1000;
  }

  if (cleanSku.includes(cleanQuery) && cleanQuery.length > 2) {
    score += 500;
  }

  expandedTerms.forEach((term) => {
    if (term.length < 2 && term !== "p" && term !== "m" && term !== "g" && term !== "gg") return;

    if (normName === term) score += 300;
    else if (normName.startsWith(term)) score += 150;
    else if (normName.includes(term)) score += 80;

    if (normCategory === term) score += 70;
    else if (normCategory.includes(term)) score += 50;

    if (normColors.includes(term)) score += 60;
    if (sizes.map((s) => normalizeSearchText(s)).includes(term)) score += 60;

    if (normDesc.includes(term)) score += 30;
    if (normComposition.includes(term)) score += 30;
  });

  if (score === 0) return 0;

  const isBestSeller = isLegacy
    ? (product as LegacyProduct).maisVendido
    : (product as FullProductAdmin).is_bestseller;
  const isNew = isLegacy
    ? (product as LegacyProduct).destaque
    : (product as FullProductAdmin).is_new;

  if (isBestSeller) score += 5;
  if (isNew) score += 3;

  return score;
}

// ==========================================
// FUNÇÕES DE BUSCA EXPORTADAS
// ==========================================

export function searchPublicProductsLocal(
  allProducts: LegacyProduct[],
  query: string,
  filters?: { categoria?: string },
  sort?: string,
): LegacyProduct[] {
  if (!query || query.trim() === "") {
    let filtered = allProducts;
    if (
      filters?.categoria &&
      filters.categoria !== "todos" &&
      filters.categoria !== "lancamentos"
    ) {
      filtered = filtered.filter((p) => p.categoria === filters.categoria);
    }
    return sortProducts(filtered, sort);
  }

  const normQuery = normalizeSearchText(query);
  const expandedTerms = expandQueryWithSynonyms(normQuery);

  let scoredProducts = allProducts
    .map((product) => ({
      product,
      score: calculateRelevance(product, query, expandedTerms),
    }))
    .filter((item) => item.score > 0);

  if (filters?.categoria && filters.categoria !== "todos" && filters.categoria !== "lancamentos") {
    scoredProducts = scoredProducts.filter((item) => item.product.categoria === filters.categoria);
  }

  scoredProducts.sort((a, b) => b.score - a.score);

  return sortProducts(
    scoredProducts.map((item) => item.product),
    sort,
  );
}

export async function searchProducts(
  query: string,
  filters?: { categoria?: string },
  sort?: string,
): Promise<LegacyProduct[]> {
  try {
    if (!query || query.trim() === "") {
      return [];
    }

    // Normaliza a query removendo acentos para busca
    const cleanQuery = query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    const searchPattern = `%${cleanQuery}%`;

    // Padrão original (com acentos) para bater com palavras acentuadas no banco
    const originalQuery = query.toLowerCase().trim();
    const searchPatternOriginal = `%${originalQuery}%`;

    // Busca direta no Supabase sem depender de RPC (tenta tanto sem acento quanto com acento)
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id, name, slug, sku, price, promotional_price, is_featured, is_bestseller, created_at, category_id, status, display_order,
        category:categories(id, name, slug),
        variations:product_variations(
          id, color_name, color_slug, hex_code, display_order,
          images:product_images(id, url, is_main, display_order),
          sizes:product_sizes(id, size, is_available, stock)
        )
      `,
      )
      .eq("status", "published")
      .or(
        `name.ilike.${searchPattern},sku.ilike.${searchPattern},name.ilike.${searchPatternOriginal}`,
      )
      .order("created_at", { ascending: false })
      .limit(48);

    if (error) {
      console.error("Erro na busca direta:", error);
      // Fallback: busca todos e filtra localmente
      const allProducts = await getPublicProducts();
      return searchPublicProductsLocal(allProducts, query, filters, sort);
    }

    if (!data || data.length === 0) {
      // Tentar busca mais ampla: pode ser nome de categoria (com ou sem acento)
      const { data: catData, error: catError } = await supabase
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
        .or(`categories.name.ilike.${searchPattern},categories.name.ilike.${searchPatternOriginal}`)
        .order("created_at", { ascending: false })
        .limit(48);

      if (catError || !catData || catData.length === 0) {
        // Fallback robusto se nada for encontrado no banco via query direta:
        // Busca todos os produtos publicados e faz a filtragem local (que remove acentos perfeitamente via JS)
        const allProducts = await getPublicProducts();
        return searchPublicProductsLocal(allProducts, query, filters, sort);
      }

      const mapped = catData.map((d: any) => mapToLegacy(d));
      return sortProducts(mapped, sort);
    }

    let mapped: LegacyProduct[] = data.map((d: any) => mapToLegacy(d));

    if (
      filters?.categoria &&
      filters.categoria !== "todos" &&
      filters.categoria !== "lancamentos"
    ) {
      mapped = mapped.filter((p) => p.categoria === filters.categoria);
    }

    // Ordenar por relevância local
    const normQuery = normalizeSearchText(query);
    const expandedTerms = expandQueryWithSynonyms(normQuery);

    mapped.sort((a, b) => {
      const scoreA = calculateRelevance(a, query, expandedTerms);
      const scoreB = calculateRelevance(b, query, expandedTerms);
      return scoreB - scoreA;
    });

    return sortProducts(mapped, sort);
  } catch (err) {
    console.error("Erro no searchProducts:", err);
    // Fallback total: busca tudo e filtra
    try {
      const allProducts = await getPublicProducts();
      return searchPublicProductsLocal(allProducts, query, filters, sort);
    } catch {
      return [];
    }
  }
}

// Mapeia resultado do Supabase para LegacyProduct (usado pela busca)
function mapToLegacy(d: any): LegacyProduct {
  const vars = d.variations || [];
  const defaultImage = "https://placehold.co/900x1200/f8f9fa/a1a1aa?text=Imagem+Pendente";
  let mainImage = defaultImage;

  if (vars.length > 0 && vars[0].images && vars[0].images.length > 0) {
    const mainImgObj = vars[0].images.find((i: any) => i.is_main) || vars[0].images[0];
    mainImage = mainImgObj.url;
  }

  return {
    id: d.id,
    nome: d.name,
    referencia: d.sku || "",
    categoria: d.category?.slug || "sem-categoria",
    descricao: "",
    preco: Number(d.price),
    precoPromocional: d.promotional_price ? Number(d.promotional_price) : undefined,
    imagem: mainImage,
    destaque: d.is_featured ?? false,
    maisVendido: d.is_bestseller ?? false,
    tamanhos:
      vars.length > 0 && vars[0].sizes
        ? vars[0].sizes.filter((s: any) => s.is_available).map((s: any) => s.size)
        : [],
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
      tamanhos: v.sizes ? v.sizes.filter((s: any) => s.is_available).map((s: any) => s.size) : [],
    })),
  };
}

export interface AutocompleteProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  promotional_price: number | null;
  main_image_url: string;
  category_name: string;
  category_slug: string;
  color_name: string;
  is_featured: boolean;
  is_bestseller: boolean;
  score: number;
}

export interface AutocompleteResponse {
  products: AutocompleteProduct[];
  categories: { name: string; slug: string }[];
  suggestions: string[];
}

async function getAutocompleteResultsLocal(query: string): Promise<AutocompleteProduct[]> {
  try {
    const allProducts = await getPublicProducts();
    const normQuery = normalizeSearchText(query);
    const expandedTerms = expandQueryWithSynonyms(normQuery);

    const scored = allProducts
      .map((p) => {
        const score = calculateRelevance(p, query, expandedTerms);
        if (score <= 0) return null;

        // Mapeia para AutocompleteProduct
        const vars = p.variacoes || [];
        const defaultImage = "https://placehold.co/900x1200/f8f9fa/a1a1aa?text=Imagem+Pendente";
        let mainImg = p.imagem || defaultImage;
        let colorName = "";

        if (vars.length > 0) {
          colorName = vars[0].cor;
          if (vars[0].imagens && vars[0].imagens.length > 0) {
            mainImg = vars[0].imagens[0] || mainImg;
          }
        }

        const generatedSlug = normalizeSearchText(p.nome).replace(/\s+/g, "-") || p.id;

        return {
          id: p.id,
          name: p.nome,
          slug: generatedSlug,
          sku: p.referencia,
          price: p.preco,
          promotional_price: p.precoPromocional || null,
          main_image_url: mainImg,
          category_name: p.categoria,
          category_slug: normalizeSearchText(p.categoria),
          color_name: colorName,
          is_featured: !!p.destaque,
          is_bestseller: !!p.maisVendido,
          score: score,
        } as AutocompleteProduct;
      })
      .filter((item): item is AutocompleteProduct => item !== null);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6);
  } catch (err) {
    console.error("Erro no autocomplete local:", err);
    return [];
  }
}

export async function getAutocompleteResults(query: string): Promise<AutocompleteResponse> {
  if (!query || query.trim().length < 2) {
    return { products: [], categories: [], suggestions: [] };
  }

  const normQuery = normalizeSearchText(query);
  let products: AutocompleteProduct[] = [];

  try {
    const { data, error } = await (supabase.rpc as any)("search_autocomplete_products", {
      p_query: normQuery,
      p_limit: 6,
    });

    if (!error && data && Array.isArray(data) && data.length > 0) {
      products = data;
    } else {
      // Fallback local se a RPC retornar vazia ou der erro
      products = await getAutocompleteResultsLocal(query);
    }
  } catch (err) {
    console.warn("Erro ao chamar RPC search_autocomplete_products, usando fallback local:", err);
    products = await getAutocompleteResultsLocal(query);
  }

  if (products.length === 0) {
    return { products: [], categories: [], suggestions: [] };
  }

  const catMap = new Map<string, { name: string; slug: string }>();
  products.forEach((p) => {
    if (p.category_name && p.category_slug) {
      catMap.set(p.category_slug, { name: p.category_name, slug: p.category_slug });
    }
  });

  const suggestions = new Set<string>();

  // Tenta expandir o sinônimo se existir
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (normQuery === key) {
      syns.slice(0, 2).forEach((s) => suggestions.add(s));
    }
  }

  if (!suggestions.has(query)) suggestions.add(query);

  return {
    products,
    categories: Array.from(catMap.values()).slice(0, 3),
    suggestions: Array.from(suggestions).slice(0, 5),
  };
}

function sortProducts(products: LegacyProduct[], sort?: string): LegacyProduct[] {
  const sorted = [...products];
  if (sort === "menor-preco") {
    sorted.sort((a, b) => (a.precoPromocional || a.preco) - (b.precoPromocional || b.preco));
  } else if (sort === "maior-preco") {
    sorted.sort((a, b) => (b.precoPromocional || b.preco) - (a.precoPromocional || a.preco));
  } else if (sort === "lancamentos") {
    sorted.sort((a, b) => (a.destaque === b.destaque ? 0 : a.destaque ? -1 : 1));
  }
  // Se não tem sort especificado, mantém a ordem da relevância (não faz sort)
  return sorted;
}

export function searchAdminProducts(
  products: FullProductAdmin[],
  query: string,
): FullProductAdmin[] {
  if (!query || query.trim() === "") return products;

  const normQuery = normalizeSearchText(query);
  const expandedTerms = expandQueryWithSynonyms(normQuery);

  const scoredProducts = products
    .map((product) => ({
      product,
      score: calculateRelevance(product, query, expandedTerms),
    }))
    .filter((item) => item.score > 0);

  scoredProducts.sort((a, b) => b.score - a.score);

  return scoredProducts.map((item) => item.product);
}
