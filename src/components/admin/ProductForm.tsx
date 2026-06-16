/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import type { FullProductAdmin } from "@/lib/services/products.service";
import type { Category } from "@/lib/services/categories.service";
import { Trash, Plus, Upload, GripVertical } from "lucide-react";

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
  const [price, setPrice] = useState(initialData?.price || 0);
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    initialData?.status || "draft",
  );
  const [isNew, setIsNew] = useState(initialData?.is_new || false);
  const [isBestseller, setIsBestseller] = useState(initialData?.is_bestseller || false);
  // Details
  const [composition, setComposition] = useState(initialData?.composition || "");
  const [care, setCare] = useState<string>(
    initialData?.care_instructions ? JSON.stringify(initialData.care_instructions) : "[]",
  );

  // Variações e Tamanhos (Simplificado para o UI)
  // Como é complexo manter state relacional completo na memória, vamos simplificar
  // e usar o Supabase em tempo real ou state trees simples
  const [variations, setVariations] = useState<any[]>(
    initialData?.variations?.map((v) => ({
      id: v.id,
      color_name: v.color_name,
      color_slug: v.color_slug,
      hex_code: v.hex_code,
      images: v.images || [],
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
    if (!name || !sku || !categoryId || price <= 0) {
      toast.error("Preencha todos os campos obrigatórios (Nome, SKU, Categoria, Preço).");
      return;
    }

    setLoading(true);
    try {
      let productId = initialData?.id;

      // 1. Salvar Produto
      const productData = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        sku,
        category_id: categoryId,
        description,
        price,
        status,
        is_new: isNew,
        is_bestseller: isBestseller,
        composition,
      };

      if (productId) {
        await supabase
          .from("products")
          .update(productData as never)
          .eq("id", productId as never);
      } else {
        const { data: newProd, error } = await supabase
          .from("products")
          .insert([productData] as never)
          .select()
          .single();
        if (error) throw error;
        productId = (newProd as any).id;
      }

      // 2. Salvar Variações (Simplificado: só insere/atualiza se não for mock)
      // Em uma aplicação real madura, você precisa fazer sync (deletar removidas, atualizar existentes, inserir novas)
      // Para manter este MVP funcional e robusto, se for atualização, vamos deletar variações antigas e recriar
      // (Isso apaga IDs, mas garante consistência na UI simplificada. Num ambiente de prod, faríamos upsert)

      if (initialData?.id) {
        await supabase
          .from("product_variations")
          .delete()
          .eq("product_id", productId as never);
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
          ] as never)
          .select()
          .single();

        if (varErr || !newVar) continue;

        // Imagens
        if (v.images.length > 0) {
          const imgsToInsert = v.images.map((img: any, idx: number) => ({
            product_id: productId,
            variation_id: (newVar as any).id,
            url: img.url,
            is_main: idx === 0,
            display_order: idx,
          }));
          await supabase.from("product_images").insert(imgsToInsert as never);
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
          await supabase.from("product_sizes").insert(sizesToInsert as never);
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
    if (!isSupabaseConfigured()) return toast.error("Sem Supabase");
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    try {
      setLoading(true);
      const { error: uploadError, data } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const newVars = [...variations];
      newVars[variationIndex].images.push({ url: publicUrlData.publicUrl, is_main: false } as any);
      setVariations(newVars);
      toast.success("Imagem enviada!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="basics">Info Básicas</TabsTrigger>
          <TabsTrigger value="variations">Cores & Imagens</TabsTrigger>
          <TabsTrigger value="sizes">Tamanhos & Estoque</TabsTrigger>
          <TabsTrigger value="details">Tecido & Cuidados</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Produto *</label>
              <input
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                }}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug da URL</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Referência / SKU *</label>
              <input
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2 border rounded-md bg-white"
              >
                <option value="">Selecione...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição Completa</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="flex gap-6 pt-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />{" "}
              É Lançamento
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
              />{" "}
              Mais Vendido
            </label>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="p-1 border rounded-md text-sm"
              >
                <option value="published">Publicado (Visível)</option>
                <option value="draft">Rascunho</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="variations" className="space-y-6">
          {variations.map((v, i) => (
            <div key={v.id || i} className="border rounded-md p-4 bg-slate-50 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-700">Variação {i + 1}</h4>
                {variations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVariations(variations.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remover
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs">Nome da Cor</label>
                  <input
                    value={v.color_name}
                    onChange={(e) => {
                      const newVars = [...variations];
                      newVars[i].color_name = e.target.value;
                      newVars[i].color_slug = e.target.value.toLowerCase().replace(/[^a-z]/g, "-");
                      setVariations(newVars);
                    }}
                    className="w-full p-2 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs">Hex (Cor na Bolinha)</label>
                  <input
                    type="color"
                    value={v.hex_code || "#000000"}
                    onChange={(e) => {
                      const newVars = [...variations];
                      newVars[i].hex_code = e.target.value;
                      setVariations(newVars);
                    }}
                    className="w-full h-9 p-1 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-2">Imagens desta Variação</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {v.images.map((img: any, imgIdx: number) => (
                    <div key={imgIdx} className="relative w-24 h-24 flex-shrink-0 group">
                      <img src={img.url} className="w-full h-full object-cover rounded-md border" />
                      <button
                        type="button"
                        onClick={() => {
                          const newVars = [...variations];
                          newVars[i].images.splice(imgIdx, 1);
                          setVariations(newVars);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 text-slate-500">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">Upload</span>
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
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
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
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar Cor / Variação
          </Button>
        </TabsContent>

        <TabsContent value="sizes" className="space-y-6">
          <p className="text-sm text-slate-500 mb-4">
            Gerencie a disponibilidade e estoque por cor.
          </p>
          {variations.map((v, i) => (
            <div key={v.id || i} className="border rounded-md p-4">
              <h4 className="font-semibold mb-3">Tamanhos para: {v.color_name}</h4>
              <div className="space-y-2">
                {v.sizes.map((s: any, sIdx: number) => (
                  <div key={sIdx} className="flex items-center gap-4 bg-slate-50 p-2 rounded">
                    <input
                      className="w-20 p-1 border rounded text-center font-medium uppercase"
                      value={s.size}
                      onChange={(e) => {
                        const newVars = [...variations];
                        newVars[i].sizes[sIdx].size = e.target.value;
                        setVariations(newVars);
                      }}
                      placeholder="P, 38..."
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Estoque:</label>
                      <input
                        type="number"
                        className="w-20 p-1 border rounded"
                        value={s.stock}
                        onChange={(e) => {
                          const newVars = [...variations];
                          newVars[i].sizes[sIdx].stock = Number(e.target.value);
                          setVariations(newVars);
                        }}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs ml-auto">
                      <input
                        type="checkbox"
                        checked={s.is_available}
                        onChange={(e) => {
                          const newVars = [...variations];
                          newVars[i].sizes[sIdx].is_available = e.target.checked;
                          setVariations(newVars);
                        }}
                      />{" "}
                      Disponível
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newVars = [...variations];
                        newVars[i].sizes.splice(sIdx, 1);
                        setVariations(newVars);
                      }}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newVars = [...variations];
                    newVars[i].sizes.push({ size: "Novo", stock: 10, is_available: true });
                    setVariations(newVars);
                  }}
                  className="text-blue-600"
                >
                  Adicionar Tamanho
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Composição do Tecido</label>
            <input
              value={composition}
              onChange={(e) => setComposition(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Ex: 95% Poliéster, 5% Elastano"
            />
          </div>
          {/* Outros campos simplificados por brevidade, poderiam ser JSON editers se necessário */}
        </TabsContent>
      </Tabs>

      <div className="mt-8 border-t pt-4 flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.navigate({ to: "/admin/produtos" })}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-pink-600 hover:bg-pink-700 text-white min-w-32"
        >
          {loading ? "Salvando..." : "Salvar Produto"}
        </Button>
      </div>
    </div>
  );
}
