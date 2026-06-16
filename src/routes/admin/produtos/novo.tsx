import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/services/categories.service";

export const Route = createFileRoute("/admin/produtos/novo")({
  loader: async () => {
    const categories = await getCategories(true);
    return { categories };
  },
  component: AdminNovoProduto,
});

function AdminNovoProduto() {
  const { categories } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Produto</h1>
        <p className="text-muted-foreground mt-2">Cadastre uma nova peça na loja.</p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
