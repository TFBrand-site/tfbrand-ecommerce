import { createFileRoute, Link } from "@tanstack/react-router";
import { getAdminProducts, type FullProductAdmin } from "@/lib/services/products.service";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreVertical, Edit, Trash, Copy } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/data/products";

export const Route = createFileRoute("/admin/produtos/")({
  loader: async () => {
    const products = await getAdminProducts();
    return { products };
  },
  component: AdminProdutosList,
});

function AdminProdutosList() {
  const { products } = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground mt-2">Gerencie as roupas, variações e estoque.</p>
        </div>
        <Link to="/admin/produtos/novo">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Novo Produto
          </Button>
        </Link>
      </div>

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Filtros */}
        <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou referência..."
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border rounded-md px-4 py-2 text-sm bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Produto</th>
                <th className="px-6 py-3 font-medium">Categoria</th>
                <th className="px-6 py-3 font-medium">Preço</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const defaultImage =
                  product.variations?.[0]?.images?.find((i) => i.is_main)?.url ||
                  "https://via.placeholder.com/40";

                return (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={defaultImage}
                          alt={product.name}
                          className="w-10 h-10 rounded-md object-cover bg-slate-100"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-slate-500">Ref: {product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{product.category?.name || "-"}</td>
                    <td className="px-6 py-4 font-medium">{formatPrice(Number(product.price))}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === "published"
                            ? "bg-green-100 text-green-700"
                            : product.status === "draft"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {product.status === "published"
                          ? "Publicado"
                          : product.status === "draft"
                            ? "Rascunho"
                            : "Arquivado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to="/admin/produtos/$id"
                        params={{ id: product.id }}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    {products.length === 0
                      ? "Nenhum produto cadastrado no banco."
                      : "Nenhum produto encontrou com os filtros atuais."}
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
