import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/lib/services/categories.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/admin/categorias")({
  loader: async () => {
    const categories = await getCategories();
    return { categories };
  },
  component: AdminCategorias,
});

function AdminCategorias() {
  const { categories: initialCategories } = Route.useLoaderData();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    slug: "",
    active: true,
    display_order: 0,
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      toast.error("Configure o Supabase para salvar categorias.");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && formData.id) {
        const updated = await updateCategory(formData.id, {
          name: formData.name,
          slug: formData.slug,
          active: formData.active,
          display_order: formData.display_order,
        });
        setCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
        toast.success("Categoria atualizada!");
      } else {
        const created = await createCategory({
          name: formData.name,
          slug: formData.slug,
          active: formData.active,
          display_order: formData.display_order,
        });
        setCategories([...categories, created]);
        toast.success("Categoria criada!");
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar categoria");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    if (!configured) return toast.error("Configure o Supabase.");

    try {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Categoria excluída!");
    } catch (error: any) {
      toast.error("Erro ao excluir. Pode haver produtos vinculados.");
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
  };

  const resetForm = () => {
    setFormData({ id: "", name: "", slug: "", active: true, display_order: 0 });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
        <p className="text-muted-foreground mt-2">Gerencie as categorias de produtos da loja.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 border rounded-xl p-6 bg-white shadow-sm h-fit">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                required
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: !isEditing
                      ? name.toLowerCase().replace(/[^a-z0-9]/g, "-")
                      : formData.slug,
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug (URL)</label>
              <input
                required
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ordem de Exibição</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <label htmlFor="active" className="text-sm font-medium">
                Categoria Ativa no Site
              </label>
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white">
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="md:col-span-2 border rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Slug</th>
                <th className="px-6 py-3 font-medium">Ordem</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((cat) => (
                  <tr key={cat.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{cat.name}</td>
                    <td className="px-6 py-4 text-slate-500">{cat.slug}</td>
                    <td className="px-6 py-4">{cat.display_order}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${cat.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}
                      >
                        {cat.active ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma categoria encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
