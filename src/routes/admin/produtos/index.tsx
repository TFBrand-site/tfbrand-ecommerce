import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  getAdminProducts,
  deleteProduct,
  type FullProductAdmin,
} from "@/lib/services/products.service";
import { searchAdminProducts } from "@/lib/services/search.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash,
  Copy,
  PackageX,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Star,
  Tags,
  Box,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/produtos/")({
  loader: async () => {
    const products = await getAdminProducts();
    return { products };
  },
  component: AdminProdutosList,
});

function AdminProdutosList() {
  const { products } = Route.useLoaderData();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { role } = useAdminRole();

  const handleDelete = async (id: string, name: string) => {
    if (role !== "admin") {
      toast.error("Acesso negado: apenas administradores podem excluir produtos definitivamente.");
      return;
    }
    if (confirm(`Tem certeza que deseja excluir permanentemente o produto "${name}"?`)) {
      try {
        setIsDeleting(id);
        await deleteProduct(id);
        toast.success("Produto excluído com sucesso!");
        router.invalidate();
      } catch (error) {
        console.error(error);
        toast.error("Erro ao excluir o produto. Tente novamente.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const baseProducts = searchAdminProducts(products, search);

  const filtered = baseProducts.filter((p) => {
    const pCategory = p.category?.name || "Sem Categoria";
    const matchCategory = selectedCategory === "all" || pCategory === selectedCategory;
    // For status, treating empty as 'published' if that's the default
    const pStatus = p.status || "published";
    const matchStatus = selectedStatus === "all" || pStatus === selectedStatus;
    return matchCategory && matchStatus;
  });

  // Metrics
  const totalProducts = products.length;
  const activeHighlights = products.filter((p) => p.is_new || p.is_bestseller).length;
  const uniqueCategories = new Set(products.map((p) => p.category?.name).filter(Boolean)).size;
  const totalStock = products.reduce((acc, p) => {
    const pStock =
      p.variations?.reduce(
        (vAcc: number, v) =>
          vAcc + (v.sizes?.reduce((sAcc: number, s) => sAcc + (s.stock || 0), 0) || 0),
        0,
      ) || 0;
    return acc + pStock;
  }, 0);

  // Extract unique categories for the dropdown
  const availableCategories = Array.from(
    new Set(products.map((p) => p.category?.name || "Sem Categoria")),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Produtos</h1>
          <p className="text-zinc-500 mt-1">Gerencie seu catálogo, variações, imagens e estoque.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/produtos/novo">
            <Button className="bg-[#D91672] hover:bg-pink-600 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 bg-[#D91672]/10 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-[#D91672]" />
          </div>
          <div className="text-3xl font-bold text-zinc-900">{totalProducts}</div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Total Publicado</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-zinc-900">{activeHighlights}</div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Destaques Ativos</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
            <Tags className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-zinc-900">{uniqueCategories}</div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Categorias Utilizadas</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
            <Box className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-zinc-900">{totalStock}</div>
          <div className="text-sm font-medium text-zinc-500 mt-1">Total em Estoque</div>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-xl bg-white shadow-sm flex flex-col overflow-hidden">
        {/* Header e Filtros */}
        <div className="p-4 border-b border-zinc-100 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nome, referência ou categoria..."
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white border-zinc-200 h-10">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white border-zinc-200 h-10">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Header da Tabela */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
            Lista de Produtos
          </h2>
          <span className="text-xs font-medium text-zinc-500 bg-white px-2 py-1 rounded-md border border-zinc-200">
            {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
          </span>
        </div>

        {/* Tabela */}
        {/* Tabela (Apenas Desktop) */}
        <div className="overflow-x-auto w-full hidden md:block">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-left">Capa / Título</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-left">Status</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-left">Categoria</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-left">Preço</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-left">Estoque</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((product) => {
                const totalStock =
                  product.variations?.reduce(
                    (acc: number, v: { sizes?: { stock?: number | null }[] }) => {
                      return (
                        acc +
                        (v.sizes?.reduce(
                          (sum: number, s: { stock?: number | null }) => sum + (s.stock || 0),
                          0,
                        ) || 0)
                      );
                    },
                    0,
                  ) || 0;

                const status = product.status || "published";

                return (
                  <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200 flex items-center justify-center">
                          {product.variations?.[0]?.images?.[0]?.url ? (
                            <img
                              src={product.variations[0].images[0].url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex flex-col gap-1">
                          <p className="font-bold text-zinc-900 truncate">{product.name}</p>
                          <p className="text-xs text-zinc-500 truncate">
                            Ref: {product.sku?.replace(/^REF[-\s:]*/i, "")}
                          </p>
                          {(product.is_new ||
                            product.is_bestseller ||
                            (product.promotional_price &&
                              Number(product.promotional_price) > 0)) && (
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {product.is_new && (
                                <span className="inline-flex items-center rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                                  Lançamento
                                </span>
                              )}
                              {product.is_bestseller && (
                                <span className="inline-flex items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                                  Mais Vendido
                                </span>
                              )}
                              {product.promotional_price &&
                                Number(product.promotional_price) > 0 && (
                                  <span className="inline-flex items-center rounded-full bg-pink-50 px-1.5 py-0.5 text-[10px] font-medium text-[#D91672] ring-1 ring-inset ring-pink-600/20">
                                    Promoção
                                  </span>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {status === "published" ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Publicado
                        </span>
                      ) : status === "draft" ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          Rascunho
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/20">
                          Arquivado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.category?.name ? (
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.promotional_price && Number(product.promotional_price) > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-[11px] text-zinc-400 line-through">
                            {formatCurrency(Number(product.price))}
                          </span>
                          <span className="text-zinc-900 font-bold">
                            {formatCurrency(Number(product.promotional_price))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-900 font-medium">
                          {formatCurrency(Number(product.price))}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {totalStock > 0 ? (
                        <span className="text-zinc-900">{totalStock} un.</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          Sem estoque
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2 transition-opacity">
                        <a
                          href={`/product/${product.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"
                          title="Visualizar no site"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Link
                          to="/admin/produtos/$id"
                          params={{ id: product.id }}
                          className="p-2 text-zinc-400 hover:text-[#D91672] transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        {role === "admin" && (
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={isDeleting === product.id}
                            className="p-2 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Excluir"
                          >
                            <Trash
                              className={`h-4 w-4 ${isDeleting === product.id ? "animate-pulse text-red-600" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <PackageX className="h-10 w-10 text-zinc-300 mb-3" />
                      <p className="font-medium text-zinc-900">Nenhum produto encontrado</p>
                      <p className="text-sm mt-1">
                        {products.length === 0
                          ? "Você ainda não cadastrou nenhum produto."
                          : "Tente ajustar os filtros de busca."}
                      </p>
                      {products.length === 0 && (
                        <Link to="/admin/produtos/novo">
                          <Button className="mt-4 bg-[#D91672] hover:bg-pink-600">
                            Adicionar Primeiro Produto
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Lista de Cards (Apenas Mobile) */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {filtered.map((product) => {
            const totalStock =
              product.variations?.reduce(
                (acc: number, v: { sizes?: { stock?: number | null }[] }) => {
                  return (
                    acc +
                    (v.sizes?.reduce(
                      (sum: number, s: { stock?: number | null }) => sum + (s.stock || 0),
                      0,
                    ) || 0)
                  );
                },
                0,
              ) || 0;

            const status = product.status || "published";

            return (
              <div
                key={product.id}
                className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col gap-3"
              >
                <div className="flex gap-3">
                  {/* Capa */}
                  <div className="w-16 h-16 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200 flex items-center justify-center">
                    {product.variations?.[0]?.images?.[0]?.url ? (
                      <img
                        src={product.variations[0].images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-zinc-400" />
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-zinc-900 text-sm truncate">{product.name}</h3>
                        {status === "published" ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            Publicado
                          </span>
                        ) : status === "draft" ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                            Rascunho
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/20">
                            Arquivado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Ref: {product.sku?.replace(/^REF[-\s:]*/i, "")}
                      </p>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1 items-center">
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200">
                        {product.category?.name || "Sem Categoria"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preço e Estoque */}
                <div className="border-t border-b border-zinc-100 py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider">
                      Preço
                    </span>
                    {product.promotional_price && Number(product.promotional_price) > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 line-through">
                          {formatCurrency(Number(product.price))}
                        </span>
                        <span className="text-zinc-950 font-bold text-sm">
                          {formatCurrency(Number(product.promotional_price))}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-950 font-bold text-sm">
                        {formatCurrency(Number(product.price))}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider">
                      Estoque
                    </span>
                    {totalStock > 0 ? (
                      <span className="text-zinc-950 font-bold text-sm">{totalStock} un.</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                        Sem estoque
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges */}
                {(product.is_featured ||
                  product.is_bestseller ||
                  (product.promotional_price && Number(product.promotional_price) > 0)) && (
                  <div className="flex flex-wrap items-center gap-1">
                    {product.is_featured && (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                        Lançamento
                      </span>
                    )}
                    {product.is_bestseller && (
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                        Mais Vendido
                      </span>
                    )}
                    {product.promotional_price && Number(product.promotional_price) > 0 && (
                      <span className="inline-flex items-center rounded-full bg-pink-50 px-1.5 py-0.5 text-[9px] font-medium text-[#D91672] ring-1 ring-inset ring-pink-600/20">
                        Promoção
                      </span>
                    )}
                  </div>
                )}

                {/* Ações */}
                <div className="flex justify-end gap-2 pt-1">
                  <a
                    href={`/product/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-zinc-200 rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-blue-50/20 transition-all cursor-pointer flex items-center justify-center"
                    title="Visualizar no site"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link
                    to="/admin/produtos/$id"
                    params={{ id: product.id }}
                    className="p-2 border border-zinc-200 rounded-lg text-[#D91672] hover:bg-pink-50/50 transition-all cursor-pointer flex items-center justify-center"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  {role === "admin" && (
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={isDeleting === product.id}
                      className="p-2 border border-zinc-200 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50/50 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Excluir"
                    >
                      <Trash
                        className={`h-4 w-4 ${isDeleting === product.id ? "animate-pulse text-red-600" : ""}`}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center text-zinc-500">
              <div className="flex flex-col items-center justify-center">
                <PackageX className="h-10 w-10 text-zinc-300 mb-3" />
                <p className="font-medium text-zinc-900">Nenhum produto encontrado</p>
                <p className="text-sm mt-1">
                  {products.length === 0
                    ? "Você ainda não cadastrou nenhum produto."
                    : "Tente ajustar os filtros de busca."}
                </p>
                {products.length === 0 && (
                  <Link to="/admin/produtos/novo">
                    <Button className="mt-4 bg-[#D91672] hover:bg-pink-600 cursor-pointer">
                      Adicionar Primeiro Produto
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
