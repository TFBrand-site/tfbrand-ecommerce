import { useState, useMemo, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ShoppingBag, Plus, Minus, ArrowLeft, X, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatPrice } from "@/data/products";
import { getPublicProducts } from "@/lib/services/products.service";
import { useCart } from "@/lib/bag-store";
import { whatsappLink, STORE_NAME } from "@/lib/config";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { CATEGORIES } from "@/data/categories";
import { useSearch } from "@/lib/search-store";
import { ProductCard } from "@/components/product/ProductCard";
import { getOptimizedImageUrl } from "@/lib/utils";

import { Header } from "@/components/layout/Header";

import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingWhatsAppButton } from "@/components/common/FloatingWhatsAppButton";

import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const products = await getPublicProducts();
    const product = products.find((p) => p.id === params.id);
    return { product, products };
  },
  head: ({ loaderData }) => {
    const { product } = loaderData || {};
    return {
      meta: [
        { title: product ? `${product.nome} — ${STORE_NAME}` : `Produto — ${STORE_NAME}` },
        {
          name: "description",
          content: product?.descricao ?? "Detalhes do produto.",
        },
      ],
    };
  },
  component: ProductPage,
});

interface SizeGuide {
  tamanho: string;
  numeracao: string;
  busto?: string;
  cintura?: string;
  quadril?: string;
  comprimento?: string;
}

interface ProductDetails {
  medidas: SizeGuide[];
  composicao: string;
  cuidados: string[];
  dicaCaimento: string;
  observacaoMedidas: string;
}

const CATEGORY_DETAILS: Record<string, ProductDetails> = {
  vestidos: {
    medidas: [
      {
        tamanho: "P",
        numeracao: "36-38",
        busto: "86-90 cm",
        cintura: "66-70 cm",
        quadril: "96-100 cm",
        comprimento: "120 cm",
      },
      {
        tamanho: "M",
        numeracao: "40",
        busto: "90-94 cm",
        cintura: "70-74 cm",
        quadril: "100-104 cm",
        comprimento: "122 cm",
      },
      {
        tamanho: "G",
        numeracao: "42",
        busto: "94-98 cm",
        cintura: "74-78 cm",
        quadril: "104-108 cm",
        comprimento: "124 cm",
      },
      {
        tamanho: "GG",
        numeracao: "44",
        busto: "98-102 cm",
        cintura: "78-82 cm",
        quadril: "108-112 cm",
        comprimento: "126 cm",
      },
    ],
    composicao:
      "Crepe Premium Fluido — 97% poliéster e 3% elastano. Tecido leve, com toque macio e excelente caimento.",
    cuidados: [
      "Lavar à mão ou em ciclo delicado.",
      "Não usar alvejante.",
      "Não secar em tambor.",
      "Secar à sombra.",
      "Passar em temperatura baixa.",
      "Guardar em local seco e arejado.",
    ],
    dicaCaimento:
      "Esta peça possui modelagem regular. Caso prefira um caimento mais soltinho, escolha um tamanho acima.",
    observacaoMedidas:
      "As medidas são aproximadas e podem variar de 1 a 3 cm por conta da modelagem, tecido ou processo de medição.",
  },
  default: {
    medidas: [
      {
        tamanho: "P",
        numeracao: "36-38",
        busto: "86-90 cm",
        cintura: "66-70 cm",
        quadril: "96-100 cm",
        comprimento: "100 cm",
      },
      {
        tamanho: "M",
        numeracao: "40",
        busto: "90-94 cm",
        cintura: "70-74 cm",
        quadril: "100-104 cm",
        comprimento: "102 cm",
      },
      {
        tamanho: "G",
        numeracao: "42",
        busto: "94-98 cm",
        cintura: "74-78 cm",
        quadril: "104-108 cm",
        comprimento: "104 cm",
      },
      {
        tamanho: "GG",
        numeracao: "44",
        busto: "98-102 cm",
        cintura: "78-82 cm",
        quadril: "108-112 cm",
        comprimento: "106 cm",
      },
    ],
    composicao: "Tecido Premium — 95% poliéster e 5% elastano. Caimento perfeito e confortável.",
    cuidados: [
      "Lavar à mão ou em ciclo delicado.",
      "Não secar em secadora.",
      "Passar em temperatura baixa.",
    ],
    dicaCaimento: "Tecido com leve elasticidade, ideal para ajuste confortável ao corpo.",
    observacaoMedidas:
      "As medidas são aproximadas e podem variar de 1 a 3 cm por conta da modelagem, tecido ou processo de medição.",
  },
};

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { setCategory } = useSearch();
  const { product, products: allProducts } = Route.useLoaderData();

  const [selectedSize, setSelectedSize] = useState<string>("");

  // Variação e Imagem Principal
  const hasMultipleVariations = (product?.variacoes?.length || 0) > 1;
  const defaultVariation = product?.variacoes?.[0] || null;
  const [selectedVariation, setSelectedVariation] = useState<typeof defaultVariation | null>(
    defaultVariation,
  );
  const [selectedImage, setSelectedImage] = useState<string>(
    defaultVariation?.imagens?.[0] || product?.imagem || "",
  );

  const [qty, setQty] = useState<number>(1);
  const [popoverOpenId, setPopoverOpenId] = useState<string | null>(null);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 450) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLightboxOpen]);

  const { add } = useCart();

  const relacionados = useMemo(() => {
    if (!product) return [];
    const sameCat = allProducts.filter(
      (p) => p.categoria === product.categoria && p.id !== product.id,
    );
    if (sameCat.length >= 4) return sameCat.slice(0, 4);

    const others = allProducts.filter(
      (p) => p.id !== product.id && p.categoria !== product.categoria,
    );
    return [...sameCat, ...others].slice(0, 4);
  }, [product, allProducts]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Header />
        <div className="mx-auto w-full max-w-[1600px] px-4 py-24 text-center">
          <h1 className="text-3xl font-semibold text-foreground">Produto não encontrado</h1>
          <p className="mt-3 text-muted-foreground">
            O produto que você procura não existe ou foi removido.
          </p>
          <Button
            onClick={() => navigate({ to: "/" })}
            className="mt-8 rounded-full cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a loja
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const catLabel = CATEGORIES.find((c) => c.slug === product.categoria)?.label ?? product.categoria;
  const details = CATEGORY_DETAILS[product.categoria] ?? CATEGORY_DETAILS.vestidos;

  const handleAddToCartClick = (e: React.MouseEvent, id: string) => {
    if (hasMultipleVariations && !selectedVariation) {
      e.preventDefault();
      toast.error("Selecione uma cor", {
        description: "Por favor, escolha uma cor antes de adicionar à sacola.",
      });
      return;
    }
    if (!selectedSize) {
      e.preventDefault();
      setPopoverOpenId(id);
    } else {
      for (let i = 0; i < qty; i++) {
        add(product, selectedSize, selectedVariation?.cor || product.variacoes?.[0]?.cor);
      }
      toast.success("Adicionado à sacola!");
    }
  };

  const renderSizePopover = () => (
    <PopoverContent
      side="top"
      align="center"
      className="w-[280px] p-4 rounded-3xl shadow-xl border-border/50 bg-white"
      sideOffset={12}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm font-semibold text-foreground">Selecione um tamanho:</span>
        <button
          onClick={() => setPopoverOpenId(null)}
          className="text-muted-foreground hover:text-[#D91672] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {availableSizes.map((size) => (
          <button
            key={size}
            onClick={() => {
              setSelectedSize(size);
              setPopoverOpenId(null);
            }}
            className="flex h-12 min-w-12 px-3 items-center justify-center rounded-full border border-border text-sm font-medium hover:border-foreground hover:bg-muted/30 transition cursor-pointer"
          >
            {size}
          </button>
        ))}
      </div>
    </PopoverContent>
  );

  const handleWhatsAppInquiry = () => {
    const colorText = selectedVariation ? `, cor ${selectedVariation.cor}` : "";
    const text = `Olá ${STORE_NAME}! Gostaria de tirar dúvidas sobre o produto: ${product.nome} (Ref: ${product.referencia})${colorText}, tamanho ${selectedSize}.`;
    window.open(whatsappLink(text), "_blank");
  };

  const availableSizes =
    selectedVariation?.tamanhos && selectedVariation.tamanhos.length > 0
      ? selectedVariation.tamanhos
      : product.tamanhos || ["P", "M", "G", "GG"];

  return (
    <div className="min-h-screen bg-background">
      <Header showCategories />

      <main className="mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-16 xl:px-24 py-8 sm:py-12 md:py-16">
        {/* Navegação / Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap pb-1 hide-scrollbar">
          <button
            onClick={() => {
              if (window.history.length > 2) {
                window.history.back();
              } else {
                navigate({ to: "/produtos" });
              }
            }}
            className="flex items-center hover:text-foreground transition-colors cursor-pointer font-semibold"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </button>
          <span>/</span>
          <Link
            to="/produtos"
            search={{ categoria: product.categoria }}
            className="hover:text-[#D91672] transition-colors cursor-pointer capitalize font-medium"
          >
            {catLabel}
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold truncate max-w-[180px] sm:max-w-sm">
            {product.nome}
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-[380px_1fr] lg:grid-cols-[460px_1fr] lg:gap-16 items-start">
          {/* Galeria de Imagens do Produto */}
          <div className="flex flex-col gap-4">
            <div
              className="relative aspect-3/4 w-full overflow-hidden rounded-2xl bg-muted shadow-lg cursor-zoom-in group md:hover:shadow-xl transition-shadow"
              onMouseMove={(e) => {
                const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - left) / width) * 100;
                const y = ((e.clientY - top) / height) * 100;
                e.currentTarget.style.setProperty("--x", `${x}%`);
                e.currentTarget.style.setProperty("--y", `${y}%`);
              }}
              onClick={() => setIsLightboxOpen(true)}
              style={{
                perspective: "1000px",
              }}
            >
              <img
                src={getOptimizedImageUrl(selectedImage, 800)}
                alt={product.nome}
                className="h-full w-full object-cover transition-transform duration-200 md:group-hover:scale-150"
                style={{
                  transformOrigin: "var(--x, 50%) var(--y, 50%)",
                }}
              />
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground opacity-100 transition-opacity group-hover:opacity-0">
                {catLabel}
              </span>
            </div>

            {/* Miniaturas da Galeria */}
            {selectedVariation &&
              selectedVariation.imagens &&
              selectedVariation.imagens.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {selectedVariation.imagens.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                        selectedImage === imgUrl
                          ? "border-primary opacity-100"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={getOptimizedImageUrl(imgUrl, 120)}
                        alt={`${product.nome} foto ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* Informações do Produto */}
          <div className="flex flex-col justify-start lg:pl-4 xl:pl-8">
            <div className="border-b border-border pb-4">
              <span className="text-xs uppercase tracking-widest text-gold font-medium">
                REF: {product.referencia?.replace(/^REF[-\s:]*/i, "").toUpperCase()}
              </span>
              <h1 className="mt-1 font-display text-2xl font-medium text-foreground sm:text-3xl leading-tight">
                {product.nome}
              </h1>

              <div className="mt-3 flex items-center gap-3">
                {product.precoPromocional && product.precoPromocional < product.preco ? (
                  <>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {formatPrice(product.precoPromocional)}
                    </p>
                    <p className="text-lg text-muted-foreground line-through decoration-muted-foreground/40 font-medium">
                      {formatPrice(product.preco)}
                    </p>
                  </>
                ) : (
                  <p className="font-display text-2xl font-bold text-foreground">
                    {formatPrice(product.preco)}
                  </p>
                )}
              </div>
            </div>

            {/* Descrição / Detalhes */}
            <div className="mt-4 text-sm text-muted-foreground leading-relaxed">
              <p>{product.descricao}</p>
            </div>

            {/* Seleção de Tamanho */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  Tamanho:{" "}
                  <span className="font-semibold text-foreground">{selectedSize || "Nenhum"}</span>
                </span>
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="text-xs underline text-muted-foreground cursor-pointer flex items-center gap-1 transition-colors hover:text-[#D91672]">
                      <Ruler className="h-3.5 w-3.5" /> Tabela de medidas
                    </button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto bg-white p-0 border-l border-border/50">
                    <div className="fixed inset-x-0 bottom-0 p-4 bg-white/80 backdrop-blur-md border-t border-border z-100 flex items-center justify-between gap-4 md:hidden pb-safe">
                      <SheetTitle className="font-display text-xl text-foreground">
                        Guia de Medidas
                      </SheetTitle>
                    </div>

                    <div className="p-6 space-y-8 text-left">
                      <div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Confira as medidas aproximadas da peça para escolher o tamanho ideal.
                        </p>
                      </div>

                      {/* Tabela de Tamanhos */}
                      <div className="space-y-4">
                        <div className="hidden sm:block rounded-xl border border-border/60 overflow-hidden shadow-sm">
                          <table className="w-full text-sm text-center">
                            <thead className="bg-muted/40 text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                              <tr>
                                <th className="px-3 py-3 text-left font-semibold">Tamanho</th>
                                <th className="px-2 py-3 font-semibold">Busto (cm)</th>
                                <th className="px-2 py-3 font-semibold">Cintura (cm)</th>
                                <th className="px-2 py-3 font-semibold">Quadril (cm)</th>
                                <th className="px-2 py-3 font-semibold">Comp. (cm)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 bg-white">
                              {details.medidas.map((m) => (
                                <tr key={m.tamanho} className="hover:bg-muted/20 transition-colors">
                                  <td className="px-3 py-3 text-left">
                                    <span className="font-bold text-foreground">{m.tamanho}</span>
                                    {m.numeracao && (
                                      <span className="text-muted-foreground ml-1 text-xs">
                                        /{m.numeracao}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-2 py-3 text-muted-foreground">
                                    {m.busto ? m.busto.replace(" cm", "") : "-"}
                                  </td>
                                  <td className="px-2 py-3 text-muted-foreground">
                                    {m.cintura ? m.cintura.replace(" cm", "") : "-"}
                                  </td>
                                  <td className="px-2 py-3 text-muted-foreground">
                                    {m.quadril ? m.quadril.replace(" cm", "") : "-"}
                                  </td>
                                  <td className="px-2 py-3 text-muted-foreground">
                                    {m.comprimento ? m.comprimento.replace(" cm", "") : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Tabela */}
                        <div className="grid gap-3 sm:hidden">
                          {details.medidas.map((m) => (
                            <div
                              key={m.tamanho}
                              className="border border-border/60 rounded-xl p-4 bg-white shadow-sm"
                            >
                              <div className="flex items-center gap-2 mb-3 border-b border-border/40 pb-2">
                                <span className="font-bold text-lg text-foreground">
                                  {m.tamanho}
                                </span>
                                {m.numeracao && (
                                  <span className="text-muted-foreground text-sm font-medium">
                                    / {m.numeracao}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-y-2 text-sm">
                                {m.busto && (
                                  <div>
                                    <span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">
                                      Busto
                                    </span>
                                    <span className="font-medium text-foreground/90">
                                      {m.busto}
                                    </span>
                                  </div>
                                )}
                                {m.cintura && (
                                  <div>
                                    <span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">
                                      Cintura
                                    </span>
                                    <span className="font-medium text-foreground/90">
                                      {m.cintura}
                                    </span>
                                  </div>
                                )}
                                {m.quadril && (
                                  <div>
                                    <span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">
                                      Quadril
                                    </span>
                                    <span className="font-medium text-foreground/90">
                                      {m.quadril}
                                    </span>
                                  </div>
                                )}
                                {m.comprimento && (
                                  <div>
                                    <span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">
                                      Comprimento
                                    </span>
                                    <span className="font-medium text-foreground/90">
                                      {m.comprimento}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Como medir */}
                      <div>
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-muted-foreground" /> Como medir
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                          <li>
                            <strong className="text-foreground font-medium">Busto:</strong> medir ao
                            redor da parte mais cheia do busto.
                          </li>
                          <li>
                            <strong className="text-foreground font-medium">Cintura:</strong> medir
                            a parte mais fina da cintura.
                          </li>
                          <li>
                            <strong className="text-foreground font-medium">Quadril:</strong> medir
                            ao redor da parte mais larga do quadril.
                          </li>
                          <li>
                            <strong className="text-foreground font-medium">Comprimento:</strong>{" "}
                            medir do ombro até a barra da peça.
                          </li>
                        </ul>
                      </div>

                      <p className="text-xs text-muted-foreground/70 italic text-center px-4 pt-4 border-t border-border/50">
                        {details.observacaoMedidas}
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.length > 0 ? (
                  availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex h-10 min-w-12 px-3 items-center justify-center rounded-lg border text-sm transition cursor-pointer ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background font-semibold"
                          : "border-border bg-background hover:border-foreground/50 text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic py-2">
                    Nenhum tamanho disponível para esta cor.
                  </span>
                )}
              </div>
            </div>

            {/* Seleção de Cores/Variações */}
            {product.variacoes && product.variacoes.length > 0 && (
              <div className="mt-5 pt-5 border-t border-border/40">
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">
                    Cor:{" "}
                    <span className="font-semibold text-foreground">{selectedVariation?.cor}</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  {product.variacoes.map((variation) => (
                    <button
                      key={variation.slug}
                      onClick={() => {
                        setSelectedVariation(variation);
                        setSelectedImage(
                          variation.imagens?.[0] || variation.thumb || product.imagem,
                        );
                      }}
                      title={variation.cor}
                      className={`w-10 h-14 rounded-md overflow-hidden border transition-all cursor-pointer relative ${
                        selectedVariation?.slug === variation.slug
                          ? "border-foreground ring-1 ring-foreground/20 shadow-sm"
                          : "border-border hover:border-foreground/50"
                      }`}
                      style={{ backgroundColor: variation.hex }}
                    >
                      {variation.thumb && (
                        <img
                          src={variation.thumb}
                          alt={variation.cor}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantidade */}
            <div className="mt-5 flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Quantidade:</span>
              <div className="flex items-center rounded-lg border border-border bg-background h-10">
                <button
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  className="flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
                  disabled={qty <= 1}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium text-foreground">{qty}</span>
                <button
                  onClick={() => setQty((prev) => prev + 1)}
                  className="flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="mt-6 flex flex-col gap-3">
              <Popover
                open={popoverOpenId === "action"}
                onOpenChange={(open) => setPopoverOpenId(open ? "action" : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    onClick={(e) => handleAddToCartClick(e, "action")}
                    className="w-full rounded-xl bg-[#D91672] hover:bg-[#c11363] text-white h-12 sm:h-14 text-sm sm:text-base font-bold cursor-pointer shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Adicionar à Sacola
                  </Button>
                </PopoverTrigger>
                {renderSizePopover()}
              </Popover>

              <Button
                variant="outline"
                onClick={handleWhatsAppInquiry}
                className="w-full rounded-xl border-green-600/30 bg-green-50/50 hover:bg-green-50 h-12 sm:h-14 text-sm sm:text-base font-bold text-green-700 hover:text-green-800 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Comprar pelo WhatsApp
              </Button>
            </div>

            {/* Accordion com Detalhes e Cuidados */}
            <Accordion type="single" collapsible className="mt-8">
              <AccordionItem value="description" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-[#D91672] transition-colors py-4">
                  Descrição do produto
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {product.descricao}
                </AccordionContent>
              </AccordionItem>

              {((typeof product.composicao === "string" && product.composicao.trim()) ||
                (typeof product.cuidados === "string" && product.cuidados.trim())) && (
                <AccordionItem value="composition-care" className="border-border/50">
                  <AccordionTrigger className="text-sm font-medium hover:text-[#D91672] transition-colors py-4">
                    Composição e Cuidados
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 space-y-3">
                    {typeof product.composicao === "string" && product.composicao.trim() && (
                      <div>
                        <strong className="text-foreground font-medium block mb-1">
                          Composição:
                        </strong>
                        <p>{product.composicao}</p>
                      </div>
                    )}
                    {typeof product.cuidados === "string" && product.cuidados.trim() && (
                      <div>
                        <strong className="text-foreground font-medium block mb-1">
                          Cuidados com a peça:
                        </strong>
                        <p>{product.cuidados}</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {typeof product.dicaCaimento === "string" && product.dicaCaimento.trim() && (
                <AccordionItem value="fit" className="border-border/50">
                  <AccordionTrigger className="text-sm font-medium hover:text-[#D91672] transition-colors py-4">
                    Dica de caimento
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {product.dicaCaimento}
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="measurements" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-[#D91672] transition-colors py-4">
                  Guia de Medidas & Tamanhos
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm bg-white mt-2">
                    <table className="w-full text-xs text-center">
                      <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="px-2.5 py-2.5 text-left font-semibold">Tamanho</th>
                          <th className="px-1.5 py-2.5 font-semibold">Busto</th>
                          <th className="px-1.5 py-2.5 font-semibold">Cintura</th>
                          <th className="px-1.5 py-2.5 font-semibold">Quadril</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 bg-white">
                        {details.medidas.map((m) => (
                          <tr key={m.tamanho} className="hover:bg-muted/10 transition-colors">
                            <td className="px-2.5 py-2.5 text-left font-bold text-foreground">
                              {m.tamanho}
                              {m.numeracao && (
                                <span className="text-muted-foreground font-normal ml-0.5">
                                  /{m.numeracao}
                                </span>
                              )}
                            </td>
                            <td className="px-1.5 py-2.5 text-muted-foreground">
                              {m.busto || "-"}
                            </td>
                            <td className="px-1.5 py-2.5 text-muted-foreground">
                              {m.cintura || "-"}
                            </td>
                            <td className="px-1.5 py-2.5 text-muted-foreground">
                              {m.quadril || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 italic mt-3 px-1">
                    {details.observacaoMedidas}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Produtos Relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-16 border-t border-border/40 pt-12 sm:pt-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D91672]">
                  Combina Com
                </span>
                <h2 className="font-display mt-1 text-2xl font-extrabold text-[#111] sm:text-3xl">
                  Quem comprou também levou
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {relacionados.map((item) => (
                <div
                  key={item.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
      <FloatingWhatsAppButton />
      <CartDrawer />
      <Toaster position="top-center" />

      {/* Sticky Bar Desktop */}
      <div
        className={`hidden sm:flex fixed bottom-0 left-0 right-0 z-40 transform transition-transform duration-300 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto w-full max-w-[1200px] p-4">
          <div className="flex items-center justify-between rounded-2xl bg-white p-3 pr-4 shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.1)] border border-border">
            <div className="flex items-center gap-4">
              <img
                src={getOptimizedImageUrl(selectedImage, 100)}
                alt={product.nome}
                className="h-14 w-12 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {product.nome}
                  {selectedSize && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      - Tamanho {selectedSize}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {product.precoPromocional && product.precoPromocional < product.preco ? (
                    <>
                      <span className="text-sm font-bold text-[#D91672]">
                        {formatPrice(product.precoPromocional)}
                      </span>
                      <span className="text-xs text-muted-foreground line-through font-normal">
                        {formatPrice(product.preco)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-foreground">
                      {formatPrice(product.preco)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Popover
              open={popoverOpenId === "sticky"}
              onOpenChange={(open) => setPopoverOpenId(open ? "sticky" : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  onClick={(e) => handleAddToCartClick(e, "sticky")}
                  className="rounded-xl bg-foreground px-8 text-sm font-medium text-background hover:bg-foreground/90 transition cursor-pointer shadow-sm h-11"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Adicionar à sacola
                </Button>
              </PopoverTrigger>
              {renderSizePopover()}
            </Popover>
          </div>
        </div>
      </div>

      {/* Lightbox em Tela Cheia */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-white/95 backdrop-blur-md">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border/50 bg-white/80 hover:bg-white shadow-sm transition-colors cursor-pointer"
          >
            <X className="h-6 w-6 text-foreground" />
          </button>

          <div
            className="relative flex h-full w-full items-center justify-center p-4 sm:p-10"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Lista de miniaturas no lado esquerdo (Desktop) */}
            {selectedVariation &&
              selectedVariation.imagens &&
              selectedVariation.imagens.length > 1 && (
                <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden flex-col gap-4 sm:flex z-50">
                  {selectedVariation.imagens.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(imgUrl);
                      }}
                      className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                        selectedImage === imgUrl
                          ? "border-[#111] opacity-100 scale-105"
                          : "border-transparent opacity-60 hover:opacity-100 bg-white"
                      }`}
                    >
                      <img
                        src={getOptimizedImageUrl(imgUrl, 120)}
                        alt={`${product.nome} miniatura`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

            <img
              src={getOptimizedImageUrl(selectedImage, 1200)}
              alt={product.nome}
              className="h-full w-auto max-w-full object-contain cursor-default rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Miniaturas Mobile (Rodapé) */}
            {selectedVariation &&
              selectedVariation.imagens &&
              selectedVariation.imagens.length > 1 && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 sm:hidden z-50">
                  {selectedVariation.imagens.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(imgUrl);
                      }}
                      className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                        selectedImage === imgUrl
                          ? "border-[#111] opacity-100 shadow-md scale-105"
                          : "border-transparent opacity-70 bg-white/50 backdrop-blur-sm"
                      }`}
                    >
                      <img
                        src={getOptimizedImageUrl(imgUrl, 100)}
                        alt={`${product.nome} miniatura`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
