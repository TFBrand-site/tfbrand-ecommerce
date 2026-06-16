import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getPublicProducts } from "@/lib/services/products.service";
import { CATEGORIES } from "@/data/categories";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingCartBar } from "@/components/cart/FloatingCartBar";
import { FloatingWhatsAppButton } from "@/components/common/FloatingWhatsAppButton";
import { NewsletterFooter } from "@/components/common/NewsletterFooter";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/config";
import { SlidersHorizontal, X, Search, ChevronRight, LayoutGrid } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProductSearch = {
  categoria?: string;
  busca?: string;
  filtro?: string;
  ordenacao?: string;
  tamanho?: string;
  cor?: string;
  preco?: string;
};

export const Route = createFileRoute("/produtos")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => {
    return {
      categoria: typeof search.categoria === "string" ? search.categoria : undefined,
      busca: typeof search.busca === "string" ? search.busca : undefined,
      filtro: typeof search.filtro === "string" ? search.filtro : undefined,
      ordenacao: typeof search.ordenacao === "string" ? search.ordenacao : undefined,
      tamanho: typeof search.tamanho === "string" ? search.tamanho : undefined,
      cor: typeof search.cor === "string" ? search.cor : undefined,
      preco: typeof search.preco === "string" ? search.preco : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Produtos | TFBrand | Moda Feminina Online" },
      {
        name: "description",
        content:
          "Explore os lançamentos, vestidos, conjuntos, croppeds e mais na TFBrand. Peças selecionadas para o seu estilo, com compra fácil via WhatsApp.",
      },
      { property: "og:title", content: "Produtos | TFBrand" },
      {
        property: "og:description",
        content:
          "Explore os lançamentos, vestidos, conjuntos, croppeds e mais na TFBrand. Peças selecionadas para o seu estilo, com compra fácil via WhatsApp.",
      },
    ],
  }),
  component: ProdutosPage,
  loader: async () => {
    const products = await getPublicProducts();
    return { products };
  },
});

const TAMANHOS = ["P", "M", "G", "GG"];
const CORES = ["Preto", "Branco", "Rosa", "Azul", "Vermelho", "Nude", "Verde", "Terracota"];
const FAIXAS_PRECO = [
  { label: "Até R$ 100", value: "0-100" },
  { label: "R$ 100 a R$ 200", value: "100-200" },
  { label: "R$ 200 a R$ 400", value: "200-400" },
  { label: "Acima de R$ 400", value: "400-" },
];

function ProdutosPage() {
  const { products } = Route.useLoaderData();
  const { categoria, busca, filtro, ordenacao, tamanho, cor, preco } = Route.useSearch();
  const navigate = useNavigate({ from: Route.id });
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const query = busca || "";
  const category = categoria || "";

  const categoryKeys = category ? category.split(",") : [];

  const toggleCategory = (slug: string) => {
    if (categoryKeys.includes(slug)) {
      const newCats = categoryKeys.filter((c) => c !== slug);
      updateSearch({
        categoria: newCats.length ? newCats.join(",") : undefined,
        filtro: undefined,
      });
    } else {
      const newCats = [...categoryKeys, slug];
      updateSearch({ categoria: newCats.join(","), filtro: undefined });
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = products.filter((p) => {
      let matchesCat = true;
      if (category === "lancamentos" || filtro === "lancamentos") {
        matchesCat = !!p.destaque;
      } else if (category === "mais-vendidos" || filtro === "mais-vendidos") {
        matchesCat = !!p.maisVendido;
      } else if (category) {
        const catArray = category.split(",");
        matchesCat = catArray.includes(p.categoria);
      }

      const matchesQ =
        !q ||
        p.nome.toLowerCase().includes(q) ||
        p.referencia.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.descricao.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));

      let matchesTamanho = true;
      if (tamanho) {
        matchesTamanho = p.tamanhos ? p.tamanhos.includes(tamanho) : false;
      }

      let matchesCor = true;
      if (cor) {
        matchesCor = p.variacoes
          ? p.variacoes.some((v) => v.cor.toLowerCase().includes(cor.toLowerCase()))
          : false;
      }

      let matchesPreco = true;
      if (preco) {
        const [min, max] = preco.split("-").map(Number);
        if (max) {
          matchesPreco = p.preco >= min && p.preco <= max;
        } else {
          matchesPreco = p.preco >= min;
        }
      }

      return matchesCat && matchesQ && matchesTamanho && matchesCor && matchesPreco;
    });

    if (ordenacao === "preco-crescente") {
      result = [...result].sort((a, b) => a.preco - b.preco);
    } else if (ordenacao === "preco-decrescente") {
      result = [...result].sort((a, b) => b.preco - a.preco);
    } else if (ordenacao === "nome-az") {
      result = [...result].sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordenacao === "nome-za") {
      result = [...result].sort((a, b) => b.nome.localeCompare(a.nome));
    }

    return result;
  }, [query, category, filtro, ordenacao, tamanho, cor, preco]);

  const updateSearch = (updates: Partial<ProductSearch>) => {
    navigate({ search: (prev) => ({ ...prev, ...updates }) });
  };

  const clearFilters = () => {
    navigate({ search: {} });
  };

  const activeFilterCount =
    categoryKeys.length + (filtro ? 1 : 0) + (tamanho ? 1 : 0) + (cor ? 1 : 0) + (preco ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const FiltersContent = () => (
    <Accordion
      type="multiple"
      defaultValue={["categoria", "preco", "tamanho", "cor"]}
      className="w-full"
    >
      {/* Categorias */}
      <AccordionItem value="categoria" className="border-zinc-100">
        <AccordionTrigger className="text-sm font-semibold text-[#111] py-4 hover:no-underline">
          Categoria
        </AccordionTrigger>
        <AccordionContent className="pt-0 pb-5">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const isSelected = categoryKeys.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  onClick={() => toggleCategory(c.slug)}
                  className={cn(
                    "px-4 py-2.5 rounded-full border text-xs font-medium transition-colors cursor-pointer",
                    isSelected
                      ? "border-[#111] bg-[#111] text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Preço */}
      <AccordionItem value="preco" className="border-zinc-100">
        <AccordionTrigger className="text-sm font-semibold text-[#111] py-4 hover:no-underline">
          Preço
        </AccordionTrigger>
        <AccordionContent className="pt-0 pb-5">
          <div className="flex flex-wrap gap-2">
            {FAIXAS_PRECO.map((f) => (
              <button
                key={f.value}
                onClick={() => updateSearch({ preco: preco === f.value ? undefined : f.value })}
                className={cn(
                  "px-4 py-2.5 rounded-full border text-xs font-medium transition-colors cursor-pointer",
                  preco === f.value
                    ? "border-[#111] bg-[#111] text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Tamanho */}
      <AccordionItem value="tamanho" className="border-zinc-100">
        <AccordionTrigger className="text-sm font-semibold text-[#111] py-4 hover:no-underline">
          Tamanho
        </AccordionTrigger>
        <AccordionContent className="pt-0 pb-5">
          <div className="flex flex-wrap gap-2">
            {TAMANHOS.map((t) => (
              <button
                key={t}
                onClick={() => updateSearch({ tamanho: tamanho === t ? undefined : t })}
                className={cn(
                  "min-w-12 px-4 py-2.5 rounded-full border text-xs font-medium flex items-center justify-center transition-colors cursor-pointer",
                  tamanho === t
                    ? "border-[#111] bg-[#111] text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Cor */}
      <AccordionItem value="cor" className="border-zinc-100 border-b-0">
        <AccordionTrigger className="text-sm font-semibold text-[#111] py-4 hover:no-underline">
          Cor
        </AccordionTrigger>
        <AccordionContent className="pt-0 pb-5">
          <div className="flex flex-wrap gap-2">
            {CORES.map((c) => {
              return (
                <button
                  key={c}
                  onClick={() => updateSearch({ cor: cor === c ? undefined : c })}
                  className={cn(
                    "px-4 py-2.5 rounded-full border text-xs font-medium transition-colors cursor-pointer",
                    cor === c
                      ? "border-[#111] bg-[#111] text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F6] flex flex-col">
      <Header />

      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-6 flex flex-col">
        {/* Topo Dinâmico (Busca vs Catálogo) */}
        <div className="mb-6 sm:mb-8">
          <nav
            className="flex justify-center text-[11px] sm:text-xs text-zinc-500 font-medium mb-2"
            aria-label="Breadcrumb"
          >
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
              <li className="inline-flex items-center">
                <Link to="/" className="hover:text-[#D91672] transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-3 h-3 mx-1 text-zinc-400" />
                  <span className="text-[#111] font-semibold">{query ? query : "Produtos"}</span>
                </div>
              </li>
            </ol>
          </nav>

          {!query ? (
            <div className="flex flex-col items-center gap-4 mt-6 mb-8 text-center">
              <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-[#111]">
                Coleção TFBrand
              </h1>
              <p className="text-sm text-zinc-500 max-w-xl mx-auto -mt-2">
                Peças femininas selecionadas para valorizar seu estilo.
              </p>
              <div className="flex flex-col items-center gap-3 mt-4">
                <span className="text-sm font-bold text-[#111]">Explorar categorias</span>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
                  {["Vestidos", "Conjuntos", "Croppeds", "Saias", "Blusas", "Calças"].map((cat) => {
                    const isActive = categoryKeys.includes(cat.toLowerCase().replace("ç", "c"));
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          const slug = cat.toLowerCase().replace("ç", "c");
                          toggleCategory(slug);
                        }}
                        className={cn(
                          "px-4 py-1.5 rounded-full border text-xs font-medium transition-colors cursor-pointer capitalize",
                          isActive
                            ? "border-[#111] bg-[#111] text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                        )}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 mt-6 mb-8 text-center">
              <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-[#111] capitalize">
                {query}
              </h1>
              <div className="flex flex-col items-center gap-3 mt-2">
                <span className="text-sm font-bold text-[#111]">Buscas sugeridas</span>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
                  {(() => {
                    const q = query.toLowerCase();
                    let sugestoes = [
                      "vestido",
                      "conjunto",
                      "cropped",
                      "calça pantalona",
                      "saia midi",
                    ];
                    if (q.includes("vestido"))
                      sugestoes = [
                        "vestido longo",
                        "vestido midi",
                        "vestido de festa",
                        "vestido canelado",
                      ];
                    else if (q.includes("conjunto"))
                      sugestoes = ["conjunto alfaiataria", "conjunto premium", "conjunto saia"];
                    else if (q.includes("calça") || q.includes("calca"))
                      sugestoes = ["calça pantalona", "calça wide leg", "calça alfaiataria"];
                    else if (q.includes("saia"))
                      sugestoes = ["saia midi", "saia alfaiataria", "saia cargo"];
                    else if (q.includes("cropped") || q.includes("blusa"))
                      sugestoes = ["cropped canelado", "blusa tricot", "body", "top"];

                    return sugestoes.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => updateSearch({ busca: sug })}
                        className="px-4 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:border-zinc-400 transition-colors cursor-pointer capitalize"
                      >
                        {sug}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar de Catálogo */}
        <div className="sticky top-[60px] sm:top-16 z-30 bg-[#FAF7F6]/95 backdrop-blur-md py-3 sm:py-4 mb-4 flex items-center justify-between gap-2">
          <p className="text-[11px] sm:text-sm text-zinc-500 font-medium whitespace-nowrap">
            <span className="text-zinc-900 font-bold">{filtered.length}</span>{" "}
            <span className="hidden sm:inline">
              {filtered.length === 1 ? "produto" : "produtos"}
            </span>
          </p>

          <div className="flex items-center gap-3">
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-1 sm:gap-2 rounded-full border border-zinc-200 bg-white px-3 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition cursor-pointer shadow-sm">
                  <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                  Filtrar {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[100%] sm:w-[400px] p-0 flex flex-col bg-white"
              >
                <SheetHeader className="p-6 border-b border-zinc-100 text-left shrink-0">
                  <SheetTitle className="text-xl font-display font-bold">Filtrar por</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 slim-scrollbar">
                  <FiltersContent />
                </div>

                {/* Footer do Drawer Fixo */}
                <div className="p-6 border-t border-zinc-100 bg-white flex items-center justify-between shrink-0 gap-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                  <button
                    onClick={() => {
                      clearFilters();
                      setIsMobileFiltersOpen(false);
                    }}
                    className="flex-1 rounded-md border border-zinc-200 bg-white py-3 text-sm font-bold text-[#111] hover:bg-zinc-50 transition cursor-pointer text-center"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="flex-[2] rounded-md bg-[#111] py-3 text-sm font-bold text-white hover:bg-[#D91672] transition shadow-sm cursor-pointer text-center"
                  >
                    {filtered.length} {filtered.length === 1 ? "produto" : "produtos"} &rarr;
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <Select
                value={ordenacao || "recentes"}
                onValueChange={(val) =>
                  updateSearch({ ordenacao: val === "recentes" ? undefined : val })
                }
              >
                <SelectTrigger className="w-auto min-w-[110px] sm:min-w-[140px] bg-white border border-zinc-200 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 h-auto text-[11px] sm:text-sm font-medium text-zinc-700 focus:ring-0 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 transition-colors cursor-pointer justify-between gap-1 sm:gap-2">
                  <SelectValue placeholder="Relevância" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-zinc-100 bg-white">
                  <SelectItem
                    value="recentes"
                    className="text-xs sm:text-sm cursor-pointer rounded-md focus:bg-zinc-100 focus:text-[#111]"
                  >
                    Relevância
                  </SelectItem>
                  <SelectItem
                    value="preco-crescente"
                    className="text-xs sm:text-sm cursor-pointer rounded-md focus:bg-zinc-100 focus:text-[#111]"
                  >
                    Menor preço
                  </SelectItem>
                  <SelectItem
                    value="preco-decrescente"
                    className="text-xs sm:text-sm cursor-pointer rounded-md focus:bg-zinc-100 focus:text-[#111]"
                  >
                    Maior preço
                  </SelectItem>
                  <SelectItem
                    value="nome-az"
                    className="text-xs sm:text-sm cursor-pointer rounded-md focus:bg-zinc-100 focus:text-[#111]"
                  >
                    Nome (A-Z)
                  </SelectItem>
                  <SelectItem
                    value="nome-za"
                    className="text-xs sm:text-sm cursor-pointer rounded-md focus:bg-zinc-100 focus:text-[#111]"
                  >
                    Nome (Z-A)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 w-full">
          {/* Content Area Full Width */}
          <div className="flex-1 w-full">
            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="mb-6 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {categoryKeys.length > 0 &&
                  categoryKeys.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 shadow-sm"
                    >
                      {CATEGORIES.find((c) => c.slug === cat)?.label || cat}
                      <button
                        onClick={() => toggleCategory(cat)}
                        className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                {filtro && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 shadow-sm">
                    {filtro === "lancamentos" ? "Novidades" : "Mais Vendidos"}
                    <button
                      onClick={() => updateSearch({ filtro: undefined })}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {tamanho && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 shadow-sm">
                    {tamanho}
                    <button
                      onClick={() => updateSearch({ tamanho: undefined })}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {cor && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 shadow-sm">
                    {cor}
                    <button
                      onClick={() => updateSearch({ cor: undefined })}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {preco && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 shadow-sm">
                    {FAIXAS_PRECO.find((f) => f.value === preco)?.label || preco}
                    <button
                      onClick={() => updateSearch({ preco: undefined })}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-bold text-zinc-400 hover:text-[#D91672] ml-1 transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Limpar
                </button>
              </div>
            )}

            {/* Grid / Empty State */}
            {filtered.length > 0 ? (
              <div className="mb-12">
                <ProductGrid products={filtered} />
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-zinc-100 shadow-sm mb-12">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold text-[#111] mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Tente ajustar os filtros, trocar de categoria ou buscar por outro termo.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center rounded-full bg-[#111] px-8 py-3 text-sm font-bold text-white hover:bg-[#D91672] transition-all shadow-sm cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}

            {/* Help Section - Personal Shopper */}
            <div className="mt-16 sm:mt-24 mb-8 w-full bg-white border border-[#D91672]/10 rounded-2xl overflow-hidden shadow-sm relative isolate">
              {/* Background Effect */}
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#D91672]/[0.03] via-transparent to-transparent"></div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-8 sm:p-12 gap-8 text-center sm:text-left">
                <div className="flex-1 max-w-xl">
                  <span className="text-[#D91672] font-semibold text-xs tracking-widest uppercase mb-2 block">
                    Personal Shopper
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#111] mb-3">
                    Não encontrou a peça perfeita?
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Nossas consultoras estão prontas no WhatsApp para ajudar você a montar o look
                    ideal para qualquer ocasião. Envie suas medidas e preferências!
                  </p>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <a
                    href={whatsappLink(
                      "Olá! Gostaria de ajuda com uma consultoria de estilo para encontrar algumas peças.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-sm font-bold text-white hover:bg-[#20bd5a] transition-transform hover:-translate-y-1 shadow-[0_10px_20px_-10px_rgba(37,211,102,0.4)] cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Falar com Consultora
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <NewsletterFooter />
      <Footer />
      <FloatingWhatsAppButton />
      <FloatingCartBar />
      <CartDrawer />
      <Toaster position="top-center" />
    </div>
  );
}
