/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import type { FullProductAdmin } from "@/lib/services/products.service";
import type { Category } from "@/lib/services/categories.service";
import { Trash, Plus, Upload, FileText, Palette, Ruler, Info, ImageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductFormProps {
  initialData?: FullProductAdmin;
  categories: Category[];
}

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Basic Info
  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priceStr, setPriceStr] = useState(
    initialData?.price ? initialData.price.toFixed(2).replace(".", ",") : "",
  );
  const [promotionalPriceStr, setPromotionalPriceStr] = useState(
    initialData?.promotional_price
      ? initialData.promotional_price.toFixed(2).replace(".", ",")
      : "",
  );
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    (initialData?.status as any) || "draft",
  );
  const [isNew, setIsNew] = useState(initialData?.is_new || false);
  const [isBestseller, setIsBestseller] = useState(initialData?.is_bestseller || false);
  // Details
  const [composition, setComposition] = useState(initialData?.composition || "");
  const [careInstructions, setCareInstructions] = useState(
    (initialData?.care_instructions as string) || "",
  );
  const [fitTip, setFitTip] = useState(initialData?.fit_tip || "");

  const [coverImage, setCoverImage] = useState<any | null>(() => {
    const mainImg = initialData?.variations?.[0]?.images?.find((i) => i.is_main);
    return mainImg || null;
  });

  // Variações e Tamanhos (Simplificado para o UI)
  const [variations, setVariations] = useState<any[]>(
    initialData?.variations?.map((v, i) => ({
      id: v.id,
      color_name: v.color_name,
      color_slug: v.color_slug,
      hex_code: v.hex_code,
      images: i === 0 ? (v.images || []).filter((img) => !img.is_main) : v.images || [],
      sizes: v.sizes || [],
    })) || [
      {
        id: "temp-1",
        color_name: "Única",
        color_slug: "unica",
        hex_code: "#000000",
        images: [],
        sizes: [
          { size: "P", stock: 10, is_available: true },
          { size: "M", stock: 10, is_available: true },
          { size: "G", stock: 10, is_available: true },
        ],
      },
    ],
  );

  const handleSave = async () => {
    if (!isSupabaseConfigured()) {
      toast.error("Configure o Supabase para salvar produtos.");
      return;
    }
    const parsedPrice = parseFloat(priceStr.replace(",", ".")) || 0;
    if (!name || !categoryId || parsedPrice <= 0) {
      toast.error("Preencha todos os campos obrigatórios (Nome, Categoria, Preço).");
      return;
    }

    setLoading(true);
    try {
      let productId = initialData?.id;

      // Pegar url da primeira imagem como a principal do produto
      const firstImage = variations?.[0]?.images?.[0]?.url || null;

      // 1. Salvar Produto
      const productData = {
        name: name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        sku: sku || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
        category_id: categoryId,
        description,
        price: parseFloat(priceStr.replace(",", ".")) || 0,
        promotional_price: promotionalPriceStr
          ? parseFloat(promotionalPriceStr.replace(",", "."))
          : null,
        status,
        is_new: isNew,
        is_bestseller: isBestseller,
        composition: composition || null,
        care_instructions: careInstructions || null,
        fit_tip: fitTip || null,
      };

      if (productId) {
        await supabase
          .from("products")
          .update(productData as never)
          .eq("id", productId);
      } else {
        const { data: newProd, error } = await supabase
          .from("products")
          .insert([productData] as never)
          .select()
          .single();
        if (error) throw error;
        productId = (newProd as any).id;
      }

      // 2. Salvar Variações
      if (productId) {
        await supabase
          .from("product_variations")
          .delete()
          .eq("product_id", productId as string);
      }

      for (let i = 0; i < variations.length; i++) {
        const v = variations[i];
        const { data: newVar, error: varErr } = await supabase
          .from("product_variations")
          .insert([
            {
              product_id: productId,
              color_name: v.color_name,
              color_slug: v.color_slug,
              hex_code: v.hex_code,
              display_order: i,
            },
          ] as any)
          .select()
          .single();

        if (varErr || !newVar) continue;

        // Imagens
        let imgsToInsert = v.images.map((img: any, idx: number) => ({
          product_id: productId,
          variation_id: (newVar as any).id,
          url: img.url,
          is_main: false,
          display_order: idx + 1,
        }));

        if (i === 0 && coverImage) {
          imgsToInsert = [
            {
              product_id: productId,
              variation_id: (newVar as any).id,
              url: coverImage.url,
              is_main: true,
              display_order: 0,
            },
            ...imgsToInsert,
          ];
        }

        if (imgsToInsert.length > 0) {
          await supabase.from("product_images").insert(imgsToInsert as any);
        }

        // Tamanhos
        if (v.sizes.length > 0) {
          const sizesToInsert = v.sizes.map((s: any) => ({
            product_id: productId,
            variation_id: (newVar as any).id,
            size: s.size,
            stock: s.stock,
            is_available: s.is_available,
          }));
          await supabase.from("product_sizes").insert(sizesToInsert as any);
        }
      }

      toast.success(
        initialData ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!",
      );
      router.navigate({ to: "/admin/produtos" });
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (variationIndex: number, file: File) => {
    if (!isSupabaseConfigured()) return toast.error("Sem Supabase configurado");
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `produtos/${fileName}`;

    try {
      setLoading(true);
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const newVars = [...variations];
      newVars[variationIndex].images.push({ url: publicUrlData.publicUrl, is_main: false } as any);
      setVariations(newVars);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro no upload da imagem");
    } finally {
      setLoading(false);
    }
  };

  const uploadCoverImage = async (file: File) => {
    if (!isSupabaseConfigured()) return toast.error("Sem Supabase configurado");
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `produtos/${fileName}`;

    try {
      setLoading(true);
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setCoverImage({ url: publicUrlData.publicUrl, is_main: true });
      toast.success("Capa enviada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro no upload da capa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-0 overflow-hidden">
      <Tabs defaultValue="basics" className="w-full">
        <div className="border-b border-zinc-100 bg-zinc-50/50 p-4">
          <TabsList className="grid w-full sm:w-[500px] grid-cols-3 bg-zinc-200/50">
            <TabsTrigger
              value="basics"
              className="data-[state=active]:bg-white data-[state=active]:text-[#D91672] data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4 mr-2 hidden sm:block" />
              Informações Básicas
            </TabsTrigger>
            <TabsTrigger
              value="variations"
              className="data-[state=active]:bg-white data-[state=active]:text-[#D91672] data-[state=active]:shadow-sm"
            >
              <Palette className="h-4 w-4 mr-2 hidden sm:block" />
              Variações
            </TabsTrigger>
            <TabsTrigger
              value="sizes"
              className="data-[state=active]:bg-white data-[state=active]:text-[#D91672] data-[state=active]:shadow-sm"
            >
              <Ruler className="h-4 w-4 mr-2 hidden sm:block" />
              Estoque
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          <TabsContent value="basics" className="space-y-6 mt-0">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Foto Principal do Produto</label>
              <div className="flex flex-wrap gap-4">
                {coverImage ? (
                  <div className="relative w-28 h-36 rounded-lg overflow-hidden shrink-0 group border border-zinc-200 shadow-sm">
                    <img src={coverImage.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setCoverImage(null)}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-transform hover:scale-110"
                        title="Remover Capa"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-[#D91672] text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
                      Capa
                    </div>
                  </div>
                ) : (
                  <label className="w-28 h-36 border-2 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#D91672] hover:bg-pink-50/50 text-zinc-500 hover:text-[#D91672] transition-colors group">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 group-hover:bg-pink-100 flex items-center justify-center mb-2 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          uploadCoverImage(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Esta foto será usada como a capa principal do produto. Mais fotos podem ser
                adicionadas na aba Variações.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Nome do Produto <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!initialData) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                  }
                }}
                className="w-full p-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
                placeholder="Ex: Jaqueta Puffer Over"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Preço (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={priceStr}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9,]/g, "");
                    if (val.startsWith("0") && val.length > 1 && !val.startsWith("0,")) {
                      val = val.replace(/^0+/, "");
                    }
                    setPriceStr(val);
                  }}
                  onBlur={() => {
                    if (priceStr) {
                      const num = parseFloat(priceStr.replace(",", "."));
                      if (!isNaN(num)) setPriceStr(num.toFixed(2).replace(".", ","));
                    }
                  }}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Preço Promocional (R$)</label>
                <input
                  type="text"
                  value={promotionalPriceStr}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9,]/g, "");
                    if (val.startsWith("0") && val.length > 1 && !val.startsWith("0,")) {
                      val = val.replace(/^0+/, "");
                    }
                    setPromotionalPriceStr(val);
                  }}
                  onBlur={() => {
                    if (promotionalPriceStr) {
                      const num = parseFloat(promotionalPriceStr.replace(",", "."));
                      if (!isNaN(num)) setPromotionalPriceStr(num.toFixed(2).replace(".", ","));
                    }
                  }}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
                  placeholder="0,00 (Opcional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full h-[42px]">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Status</label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="w-full h-[42px]">
                    <SelectValue placeholder="Selecione o status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Publicado (Visível na loja)</SelectItem>
                    <SelectItem value="draft">Rascunho (Apenas no Admin)</SelectItem>
                    <SelectItem value="archived">Arquivado (Oculto)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                Composição do Tecido
                <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Opcional
                </span>
              </label>
              <textarea
                value={composition}
                onChange={(e) => setComposition(e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all resize-none"
                placeholder="Ex: 95% poliéster e 5% elastano"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                  Cuidados com a peça
                  <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Opcional
                  </span>
                </label>
                <textarea
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all resize-none"
                  placeholder="Ex: Lavar à mão. Não usar secadora."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                  Dica de caimento
                  <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Opcional
                  </span>
                </label>
                <textarea
                  value={fitTip}
                  onChange={(e) => setFitTip(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all resize-none"
                  placeholder="Ex: Modelagem justa, recomendamos pegar um número maior."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Descrição Completa</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full p-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all resize-y"
                placeholder="Descreva os detalhes da peça, modelagem, caimento..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-6 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-5 rounded border border-zinc-300 bg-white peer-checked:bg-[#D91672] peer-checked:border-[#D91672] flex items-center justify-center transition-all">
                    {isNew && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
                <span className="font-medium text-zinc-700">Produto Lançamento</span>
              </label>
            </div>
          </TabsContent>

          <TabsContent value="variations" className="space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                Adicione cores diferentes e fotos para cada cor.
              </p>
              <Button
                type="button"
                onClick={() =>
                  setVariations([
                    ...variations,
                    {
                      id: `new-${Date.now()}`,
                      color_name: "Nova Cor",
                      color_slug: "nova-cor",
                      hex_code: "#cccccc",
                      images: [],
                      sizes: [{ size: "P", stock: 10, is_available: true }],
                    },
                  ])
                }
                className="bg-[#D91672] hover:bg-pink-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar Cor
              </Button>
            </div>

            <Accordion
              type="multiple"
              defaultValue={variations.map((v, i) => v.id || String(i))}
              className="space-y-4"
            >
              {variations.map((v, i) => (
                <AccordionItem
                  key={v.id || i}
                  value={v.id || String(i)}
                  className="border border-zinc-200 rounded-xl bg-white shadow-sm transition-all hover:border-zinc-300 overflow-hidden data-[state=open]:shadow-md"
                >
                  <div className="flex justify-between items-center pr-4 bg-zinc-50/50">
                    <AccordionTrigger className="flex-1 px-5 hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-6 w-6 rounded-full border shadow-inner"
                          style={{ backgroundColor: v.hex_code || "#000" }}
                        />
                        <h4 className="font-bold text-zinc-800 text-base">
                          {v.color_name && v.color_name !== "Nova Cor"
                            ? v.color_name
                            : `Variação ${i + 1}`}
                        </h4>
                      </div>
                    </AccordionTrigger>
                    {variations.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVariations(variations.filter((_, idx) => idx !== i));
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 z-10"
                      >
                        <Trash className="w-4 h-4 mr-2" /> Remover
                      </Button>
                    )}
                  </div>

                  <AccordionContent className="px-5 pb-5 pt-4 border-t border-zinc-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                          Nome da Cor
                        </label>
                        <input
                          value={v.color_name}
                          onChange={(e) => {
                            const newVars = [...variations];
                            newVars[i].color_name = e.target.value;
                            newVars[i].color_slug = e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]/g, "-");
                            setVariations(newVars);
                          }}
                          className="w-full p-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
                          placeholder="Ex: Preto, Azul Marinho..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                          Cor Hexadecimal
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={v.hex_code || "#000000"}
                            onChange={(e) => {
                              const newVars = [...variations];
                              newVars[i].hex_code = e.target.value;
                              setVariations(newVars);
                            }}
                            className="h-10 w-16 p-0 border-0 rounded overflow-hidden cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={v.hex_code || "#000000"}
                            onChange={(e) => {
                              const newVars = [...variations];
                              newVars[i].hex_code = e.target.value;
                              setVariations(newVars);
                            }}
                            className="flex-1 p-2.5 border border-zinc-200 rounded-lg text-sm uppercase text-zinc-600 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider block mb-3">
                        Imagens (Mínimo 1)
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {v.images.map((img: any, imgIdx: number) => (
                          <div
                            key={imgIdx}
                            className="relative w-28 h-36 rounded-lg overflow-hidden shrink-0 group border border-zinc-200 shadow-sm"
                          >
                            <img src={img.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const newVars = [...variations];
                                  newVars[i].images.splice(imgIdx, 1);
                                  setVariations(newVars);
                                }}
                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-transform hover:scale-110"
                                title="Remover Imagem"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <label className="w-28 h-36 border-2 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#D91672] hover:bg-pink-50/50 text-zinc-500 hover:text-[#D91672] transition-colors group">
                          <div className="h-10 w-10 rounded-full bg-zinc-100 group-hover:bg-pink-100 flex items-center justify-center mb-2 transition-colors">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                uploadImage(i, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="sizes" className="space-y-6 mt-0">
            <p className="text-sm text-zinc-500 mb-6">
              Defina os tamanhos e as quantidades em estoque para cada cor.
            </p>
            {variations.map((v, i) => (
              <div
                key={v.id || i}
                className="border border-zinc-200 rounded-xl p-0 overflow-hidden shadow-sm"
              >
                <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border shadow-inner"
                      style={{ backgroundColor: v.hex_code || "#000" }}
                    />
                    <h4 className="font-bold text-zinc-800 text-sm">Estoque: {v.color_name}</h4>
                  </div>
                </div>
                <div className="p-5 space-y-3 bg-white">
                  {v.sizes.length === 0 && (
                    <div className="text-center py-6 text-zinc-400 text-sm border-2 border-dashed rounded-lg">
                      Nenhum tamanho configurado. Adicione P, M, G, 38, 40 etc.
                    </div>
                  )}
                  {v.sizes.map((s: any, sIdx: number) => (
                    <div
                      key={sIdx}
                      className="flex flex-wrap items-center gap-4 bg-zinc-50/50 border border-zinc-100 p-3 rounded-lg group hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex-1 min-w-[100px]">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                          Tamanho
                        </label>
                        <input
                          className="w-full p-2 border border-zinc-200 rounded-md text-sm font-semibold uppercase text-center focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672]"
                          value={s.size}
                          onChange={(e) => {
                            const newVars = [...variations];
                            newVars[i].sizes[sIdx].size = e.target.value;
                            setVariations(newVars);
                          }}
                          placeholder="P, M, G..."
                        />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          className="w-full p-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672]"
                          value={s.stock}
                          onChange={(e) => {
                            const newVars = [...variations];
                            newVars[i].sizes[sIdx].stock = Number(e.target.value);
                            setVariations(newVars);
                          }}
                        />
                      </div>
                      <div className="w-[120px] flex items-center justify-center pt-5">
                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={s.is_available}
                              onChange={(e) => {
                                const newVars = [...variations];
                                newVars[i].sizes[sIdx].is_available = e.target.checked;
                                setVariations(newVars);
                              }}
                              className="peer sr-only"
                            />
                            <div className="h-5 w-5 rounded border border-zinc-300 bg-white peer-checked:bg-emerald-500 peer-checked:border-emerald-500 flex items-center justify-center transition-all">
                              {s.is_available && <span className="text-white text-xs">✓</span>}
                            </div>
                          </div>
                          <span className="font-medium text-zinc-700 text-xs">Ativo</span>
                        </label>
                      </div>
                      <div className="pt-5 flex items-center pr-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newVars = [...variations];
                            newVars[i].sizes.splice(sIdx, 1);
                            setVariations(newVars);
                          }}
                          className="text-zinc-400 hover:text-red-600 transition-colors bg-white p-1.5 border border-zinc-200 rounded-md hover:border-red-200 hover:bg-red-50"
                          title="Remover Tamanho"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newVars = [...variations];
                      newVars[i].sizes.push({ size: "Novo", stock: 10, is_available: true });
                      setVariations(newVars);
                    }}
                    className="w-full border-dashed border-zinc-300 text-zinc-600 hover:text-[#D91672] hover:bg-pink-50 hover:border-[#D91672]"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Tamanho
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <div className="mt-8 pt-6 border-t border-zinc-200 flex justify-end gap-3 bg-white">
            <Button
              variant="outline"
              className="border-zinc-200"
              onClick={() => router.navigate({ to: "/admin/produtos" })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#D91672] hover:bg-pink-600 text-white min-w-32 shadow-sm"
            >
              {loading ? "Salvando..." : "Salvar Produto"}
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
