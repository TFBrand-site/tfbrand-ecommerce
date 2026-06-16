import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/services/categories.service";
import { getAdminProducts } from "@/lib/services/products.service";

export const Route = createFileRoute("/admin/produtos/$id")({
  loader: async ({ params }) => {
    const [categories, allProducts] = await Promise.all([
      getCategories(true),
      getAdminProducts(), // Ideally we would have getAdminProductById, mas podemos filtrar do cache local ou buscar assim.
    ]);
    const product = allProducts.find((p) => p.id === params.id);
    if (!product) throw new Error("Produto não encontrado");
    return { categories, product };
  },
  component: AdminEditProduto,
});

function AdminEditProduto() {
  const { categories, product } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Produto: {product.name}</h1>
        <p className="text-muted-foreground mt-2">Altere as informações e salve.</p>
      </div>

      <ProductForm categories={categories} initialData={product} />
    </div>
  );
}
