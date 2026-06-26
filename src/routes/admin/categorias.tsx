/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrders,
  type Category,
} from "@/lib/services/categories.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getPublicProducts } from "@/lib/services/products.service";
import {
  Edit,
  Trash,
  Plus,
  Tag,
  FolderTree,
  AlertCircle,
  GripVertical,
  Search,
  LayoutGrid,
  TrendingUp,
  Clock,
  Link as LinkIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Modifier } from "@dnd-kit/core";

const restrictToVerticalAxis: Modifier = ({ transform }) => {
  return {
    ...transform,
    x: 0,
  };
};

export const Route = createFileRoute("/admin/categorias")({
  loader: async () => {
    const [categories, products] = await Promise.all([getCategories(), getPublicProducts()]);
    return {
      categories: categories.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
      products,
    };
  },
  component: AdminCategorias,
});

// Row Component for Sortable (Refatorado para divs responsivas)
function SortableCategoryRow({
  cat,
  handleEdit,
  handleDelete,
  productCount,
}: {
  cat: Category;
  handleEdit: (cat: Category) => void;
  handleDelete: (id: string) => void;
  productCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 md:py-3.5 hover:bg-zinc-50/50 transition-colors border-b border-zinc-100 last:border-b-0 gap-3 md:gap-0 ${
        isDragging ? "bg-zinc-50 opacity-50 shadow-md" : "bg-white"
      }`}
    >
      {/* Esquerda: Drag Handle + Info */}
      <div className="flex items-center gap-3 min-w-0 md:w-1/3">
        <button
          className="cursor-grab hover:text-[#D91672] text-zinc-400 active:cursor-grabbing p-1 shrink-0"
          {...attributes}
          {...listeners}
          title="Arrastar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <span className="font-bold text-zinc-900 block truncate text-sm sm:text-base">
            {cat.name}
          </span>
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 mt-0.5 truncate max-w-full">
            {cat.slug}
          </span>
        </div>
      </div>

      {/* Direita: Ordem, Produtos, Status e Ações */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end gap-3 md:gap-12 md:w-2/3 pr-0 md:pr-4">
        {/* Ordem */}
        <div className="flex flex-col items-start md:items-center md:w-16">
          <span className="text-[9px] uppercase font-bold text-zinc-400 md:hidden">Ordem</span>
          <span className="text-xs font-semibold text-zinc-700 md:text-sm">
            {cat.display_order}
          </span>
        </div>

        {/* Produtos Vinculados */}
        <div className="flex flex-col items-start md:items-center md:w-24">
          <span className="text-[9px] uppercase font-bold text-zinc-400 md:hidden">Produtos</span>
          <span className="inline-flex items-center text-[10px] sm:text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">
            {productCount} {productCount === 1 ? "produto" : "produtos"}
          </span>
        </div>

        {/* Status */}
        <div className="flex flex-col items-start md:items-center md:w-20">
          <span className="text-[9px] uppercase font-bold text-zinc-400 md:hidden">Status</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium ring-1 ring-inset ${
              cat.active
                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                : "bg-slate-50 text-slate-700 ring-slate-500/20"
            }`}
          >
            {cat.active ? "Ativa" : "Inativa"}
          </span>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-1.5 md:w-20 w-full border-t border-zinc-50 pt-2 md:pt-0 md:border-t-0">
          <button
            onClick={() => handleEdit(cat)}
            className="p-2 md:p-1.5 border border-zinc-200 md:border-0 rounded-lg text-zinc-400 hover:text-[#D91672] transition-colors cursor-pointer flex-1 md:flex-none flex justify-center items-center"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(cat.id)}
            className="p-2 md:p-1.5 border border-zinc-200 md:border-0 rounded-lg text-zinc-400 hover:text-red-600 transition-colors cursor-pointer flex-1 md:flex-none flex justify-center items-center"
            title="Excluir"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminCategorias() {
  const { categories: initialCategories, products } = Route.useLoaderData();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    slug: string;
    active: boolean;
    display_order: number | string;
  }>({
    id: "",
    name: "",
    slug: "",
    active: true,
    display_order: 0,
  });
  const [isEditing, setIsEditing] = useState(false);

  // Metrics Calculation
  const totalCategories = categories.length;
  const linkedProducts = products.length;

  let mostUsedCategory = { name: "Nenhuma", count: 0 };
  if (products.length > 0 && categories.length > 0) {
    const categoryCounts: Record<string, { name: string; count: number }> = {};
    products.forEach((p) => {
      const catSlug = p.categoria;
      if (catSlug && catSlug !== "sem-categoria") {
        if (!categoryCounts[catSlug]) {
          const catName = categories.find((c) => c.slug === catSlug)?.name || catSlug;
          categoryCounts[catSlug] = { name: catName, count: 0 };
        }
        categoryCounts[catSlug].count++;
      }
    });

    let maxCount = 0;
    let maxCat = "Nenhuma";
    for (const slug in categoryCounts) {
      if (categoryCounts[slug].count > maxCount) {
        maxCount = categoryCounts[slug].count;
        maxCat = categoryCounts[slug].name;
      }
    }
    if (maxCount > 0) {
      mostUsedCategory = { name: maxCat, count: maxCount };
    }
  }

  const latestCategory =
    categories.length > 0
      ? [...categories].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
        )[0]?.name || "Nenhuma"
      : "Nenhuma";

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Dnd Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const reorderedCategories = arrayMove(categories, oldIndex, newIndex);

      // Update display_orders sequentially (1-indexed)
      const updatedCategories = reorderedCategories.map((cat, index) => ({
        ...cat,
        display_order: index + 1,
      }));

      setCategories(updatedCategories);

      if (configured) {
        // Run update silently
        try {
          const updates = updatedCategories.map((c) => ({
            id: c.id,
            display_order: c.display_order || 0,
          }));
          await updateCategoryOrders(updates);
        } catch (error: any) {
          toast.error("Erro ao salvar a nova ordem no banco de dados.");
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      toast.error("Configure o Supabase para salvar categorias.");
      return;
    }

    const parsedOrder = Number(formData.display_order);
    if (formData.display_order === "" || isNaN(parsedOrder) || parsedOrder < 0) {
      toast.error("Por favor, insira uma ordem de exibição válida.");
      return;
    }

    const isOrderUsed = categories.some(
      (c) => c.id !== formData.id && c.display_order === parsedOrder,
    );
    if (isOrderUsed) {
      toast.error(`O número de exibição ${parsedOrder} já está em uso por outra categoria.`);
      return;
    }

    setLoading(true);
    try {
      if (isEditing && formData.id) {
        const updated = await updateCategory(formData.id, {
          name: formData.name,
          slug: formData.slug,
          active: formData.active,
          display_order: parsedOrder,
        });
        setCategories(
          categories
            .map((c) => (c.id === updated.id ? updated : c))
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
        );
        toast.success("Categoria atualizada com sucesso!");
      } else {
        const nextOrder =
          categories.length > 0 ? Math.max(...categories.map((c) => c.display_order || 0)) + 1 : 1;
        const created = await createCategory({
          name: formData.name,
          slug: formData.slug,
          active: formData.active,
          display_order: nextOrder,
        });
        setCategories(
          [...categories, created].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
        );
        toast.success("Categoria criada com sucesso!");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar categoria");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria permanentemente?")) return;
    if (!configured) return toast.error("Configure o Supabase.");

    try {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Categoria excluída com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao excluir. Pode haver produtos vinculados a esta categoria.");
    }
  };

  const handleEdit = (cat: Category) => {
    setFormData({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      active: cat.active ?? true,
      display_order: cat.display_order ?? 0,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ id: "", name: "", slug: "", active: true, display_order: 0 });
    setIsEditing(false);
  };

  const handleOpenNewModal = () => {
    resetForm();
    const nextOrder =
      categories.length > 0 ? Math.max(...categories.map((c) => c.display_order || 0)) + 1 : 1;
    setFormData((prev) => ({ ...prev, display_order: nextOrder }));
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Categorias</h1>
          <p className="text-zinc-500 mt-1">Gerencie e ordene a estrutura do catálogo.</p>
        </div>

        <Button
          onClick={handleOpenNewModal}
          className="bg-[#D91672] hover:bg-pink-600 text-white shadow-sm cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center mb-4">
            <LayoutGrid className="w-5 h-5 text-[#D91672]" />
          </div>
          <div className="text-3xl font-bold text-zinc-900">{totalCategories}</div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Total de Categorias</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-zinc-900 truncate" title={mostUsedCategory.name}>
            {mostUsedCategory.name}
          </div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Mais Utilizada</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-zinc-900 truncate" title={latestCategory}>
            {latestCategory}
          </div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Última Criada</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-zinc-900">{linkedProducts}</div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Produtos Vinculados</div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-zinc-200 rounded-xl leading-5 bg-white placeholder-zinc-500 focus:outline-none focus:placeholder-zinc-400 focus:border-[#D91672] focus:ring-1 focus:ring-[#D91672] sm:text-sm transition duration-150 ease-in-out"
          placeholder="Pesquisar por nome ou slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-[#D91672]" />
              {isEditing ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 uppercase tracking-wider">
                Nome da Categoria <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
                placeholder="Ex: Jaquetas"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "-")
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, ""),
                  });
                }}
              />
              <p className="text-xs text-zinc-500 mt-1">
                O slug identificador na URL será gerado automaticamente.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
              <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <div className="h-5 w-5 rounded border border-zinc-300 bg-white peer-checked:bg-emerald-500 peer-checked:border-emerald-500 flex items-center justify-center transition-all">
                    {formData.active && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-zinc-900 block">Ativa no site</span>
                  <span className="text-xs text-zinc-500">
                    Exibe a categoria no menu principal.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 border-zinc-200 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#D91672] hover:bg-pink-600 text-white shadow-sm cursor-pointer"
              >
                {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Adicionar Categoria"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col w-full">
        {/* Cabeçalho da Lista - Apenas Desktop */}
        <div className="hidden md:flex items-center justify-between bg-zinc-50/50 border-b border-zinc-200 text-zinc-500 text-xs font-semibold px-6 py-3 uppercase tracking-wider">
          <div className="flex items-center gap-3 w-1/3">
            <span className="w-[24px]"></span> {/* Espaço do drag handle */}
            <span>Nome / Slug</span>
          </div>
          <div className="flex items-center justify-end gap-12 w-2/3 pr-4">
            <span className="w-16 text-center">Ordem</span>
            <span className="w-24 text-center">Produtos</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-20 text-right">Ações</span>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="divide-y divide-zinc-100">
            <SortableContext
              items={filteredCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredCategories.map((cat) => (
                <SortableCategoryRow
                  key={cat.id}
                  cat={cat}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  productCount={products.filter((p) => p.categoria === cat.slug).length}
                />
              ))}
            </SortableContext>
            {filteredCategories.length === 0 && (
              <div className="px-6 py-16 text-center text-zinc-500">
                <div className="flex flex-col items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-zinc-300 mb-3" />
                  <p className="font-medium text-zinc-900">Nenhuma categoria encontrada</p>
                  <p className="text-sm mt-1">Clique em "Nova Categoria" para criar a primeira.</p>
                </div>
              </div>
            )}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
