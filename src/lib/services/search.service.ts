import { getPublicProducts, type LegacyProduct, type FullProductAdmin } from "./products.service";

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
  const allProducts = await getPublicProducts();
  return searchPublicProductsLocal(allProducts, query, filters, sort);
}

export interface SearchSuggestionItem {
  type: "product" | "category" | "term" | "action";
  label: string;
  searchValue: string;
}

export async function getSearchSuggestionsData(
  query: string,
  allProducts?: LegacyProduct[],
): Promise<SearchSuggestionItem[]> {
  if (!query || query.trim().length < 2) return [];

  const products = allProducts || (await getPublicProducts());
  const normQuery = normalizeSearchText(query);
  const results = searchPublicProductsLocal(products, query);

  const suggestions: SearchSuggestionItem[] = [];
  const addedValues = new Set<string>();

  const addSuggestion = (
    type: SearchSuggestionItem["type"],
    label: string,
    searchValue: string,
  ) => {
    const val = normalizeSearchText(searchValue);
    // Ignore exact duplicates of what the user already typed
    if (!addedValues.has(val) && val !== normQuery) {
      suggestions.push({ type, label, searchValue });
      addedValues.add(val);
    }
  };

  // 1. Exact SKU Match
  const exactSkuMatch = results.find((p) => {
    const sku = normalizeSearchText(p.referencia)
      .replace(/^ref\s*/, "")
      .replace(/[-\s]/g, "");
    const cleanQ = normQuery.replace(/^ref\s*/, "").replace(/[-\s]/g, "");
    return sku === cleanQ;
  });

  if (exactSkuMatch) {
    addSuggestion(
      "product",
      `${exactSkuMatch.nome} — REF ${exactSkuMatch.referencia}`,
      exactSkuMatch.referencia,
    );
    addSuggestion("category", exactSkuMatch.categoria.replace(/-/g, " "), exactSkuMatch.categoria);
  }

  // 2. Synonyms that match what user is typing
  let suggestedMainTerm = query;
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (key.startsWith(normQuery) && key !== normQuery) {
      addSuggestion("term", key, key);
      suggestedMainTerm = key;
      break; // just take the first matching synonym
    }
  }

  // 3. Extract intel from results
  if (results.length > 0 && !exactSkuMatch) {
    const categoriesCount: Record<string, number> = {};
    const colorsCount: Record<string, number> = {};

    results.forEach((p) => {
      categoriesCount[p.categoria] = (categoriesCount[p.categoria] || 0) + 1;
      if (p.variacoes) {
        p.variacoes.forEach((v) => {
          colorsCount[v.cor] = (colorsCount[v.cor] || 0) + 1;
        });
      }
    });

    const topCat = Object.keys(categoriesCount).sort(
      (a, b) => categoriesCount[b] - categoriesCount[a],
    )[0];
    const topColor = Object.keys(colorsCount).sort((a, b) => colorsCount[b] - colorsCount[a])[0];

    // Suggest top category if it's not what the user searched
    if (topCat && !normalizeSearchText(topCat).includes(normQuery)) {
      addSuggestion("category", topCat.replace(/-/g, " "), topCat);
    }

    // 4. Extract words from product names
    let addedNames = 0;
    for (const p of results) {
      const normName = normalizeSearchText(p.nome);
      const queryWords = normalizeSearchText(suggestedMainTerm).split(" ");
      const lastQueryWord = queryWords[queryWords.length - 1];

      if (normName.includes(lastQueryWord)) {
        const words = normName.split(" ");
        const idx = words.indexOf(lastQueryWord);
        if (idx !== -1 && idx + 1 < words.length) {
          const twoWords = `${words[idx]} ${words[idx + 1]}`;
          addSuggestion("term", twoWords, twoWords);
          addedNames++;
        }
      }
      if (addedNames >= 2) break;
    }

    // 5. Category + Color combo
    if (topCat && topColor) {
      const combo = `${topCat.replace(/-/g, " ")} ${topColor}`;
      addSuggestion("term", combo, combo);
    }
  }

  // 6. If full query is a synonym
  if (SYNONYMS[normQuery] && !exactSkuMatch) {
    SYNONYMS[normQuery].slice(0, 4).forEach((syn) => {
      addSuggestion("term", syn, syn);
    });
  }

  // 7. Last resort: current query
  if (suggestions.length < 5 && results.length > 0) {
    addSuggestion("term", query, query);
  }

  if (results.length === 0) {
    addSuggestion("action", "Ver Lançamentos", "lancamentos");
    addSuggestion("action", "Ver Mais Vendidos", "mais-vendidos");
  }

  return suggestions.slice(0, 6).map((s) => ({
    ...s,
    label: s.label.charAt(0).toUpperCase() + s.label.slice(1),
  }));
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
