import { createFileRoute, Link } from "@tanstack/react-router";
import { getAdminProducts } from "@/lib/services/products.service";
import { getCategories } from "@/lib/services/categories.service";
import { getLeads } from "@/lib/services/leads.service";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  ShoppingCart,
  Tags,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BadgePercent,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    try {
      const [products, categories, leads] = await Promise.all([
        getAdminProducts(),
        getCategories(true),
        getLeads(),
      ]);
      return { products, categories, leads };
    } catch (error) {
      console.error("Erro no loader do dashboard:", error);
      return {
        products: [],
        categories: [],
        leads: [],
      };
    }
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const { products, categories, leads } = Route.useLoaderData();

  const publishedProducts = products.filter(
    (p) => p.status === "published" || p.status === undefined,
  );
  const draftProducts = products.filter((p) => p.status === "draft");

  const lancamentos = products.filter((p) => p.is_new).length;
  const maisVendidos = products.filter((p) => p.is_bestseller).length;
  const emPromocao = products.filter(
    (p) => p.promotional_price && Number(p.promotional_price) > 0,
  ).length;

  // Receita estimada (soma dos subtotals dos leads)
  const receitaEstimada = leads.reduce((acc, l) => acc + (l.subtotal || 0), 0);
  const leadsConfirmados = leads.filter((l) => l.status === "confirmado").length;
  const leadsIniciados = leads.filter((l) => l.status === "iniciado").length;

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
    .slice(0, 5);
  const recentLeads = [...leads].slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Visão geral da sua loja TFBrand.</p>
        </div>
        <Link
          to="/admin/produtos/novo"
          className="inline-flex items-center justify-center rounded-xl bg-[#D91672] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#D91672]/25 hover:bg-pink-600 transition-all gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Produto
        </Link>
      </div>

      {/* ── Primary Metrics ────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-zinc-500">Produtos</h3>
            <Package className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{products.length}</div>
          <p className="text-xs text-zinc-500 mt-1">
            {publishedProducts.length} publicados · {draftProducts.length} rascunhos
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-zinc-500">Pedidos</h3>
            <ShoppingCart className="h-4 w-4 text-[#D91672]" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{leads.length}</div>
          <p className="text-xs text-zinc-500 mt-1">
            {leadsConfirmados} confirmados · {leadsIniciados} aguardando
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-zinc-500">Receita Estimada</h3>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{formatCurrency(receitaEstimada)}</div>
          <p className="text-xs text-zinc-500 mt-1">Total dos pedidos registrados</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-zinc-500">Categorias</h3>
            <Tags className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{categories.length}</div>
          <p className="text-xs text-zinc-500 mt-1">Ativas no catálogo</p>
        </div>
      </div>

      {/* ── Secondary Stats ────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-3">
        <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-pink-50 flex items-center justify-center text-[#D91672]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Lançamentos</p>
            <p className="text-lg font-bold text-zinc-900">{lancamentos}</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Mais Vendidos</p>
            <p className="text-lg font-bold text-zinc-900">{maisVendidos}</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
            <BadgePercent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Em Promoção</p>
            <p className="text-lg font-bold text-zinc-900">{emPromocao}</p>
          </div>
        </div>
      </div>

      {/* ── Tables: Recent Products & Recent Leads ─────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recentes Produtos */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">Últimos Produtos</h2>
            <Link
              to="/admin/produtos"
              className="text-sm font-medium text-[#D91672] hover:text-pink-600 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 p-0">
            {recentProducts.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {recentProducts.map((p) => (
                  <Link
                    key={p.id}
                    to="/admin/produtos/$id"
                    params={{ id: p.id }}
                    className="p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                      {p.variations?.[0]?.images?.[0]?.url ? (
                        <img
                          src={p.variations[0].images[0].url}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-zinc-400 m-auto mt-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate">{p.name}</p>
                      <p className="text-xs text-zinc-500 capitalize">
                        {p.category?.name || "Sem Categoria"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {p.promotional_price && Number(p.promotional_price) > 0 ? (
                        <>
                          <p className="text-[10px] text-zinc-400 line-through">
                            {formatCurrency(Number(p.price))}
                          </p>
                          <p className="text-sm font-bold text-[#D91672]">
                            {formatCurrency(Number(p.promotional_price))}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-zinc-900">
                          {formatCurrency(Number(p.price))}
                        </p>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset mt-0.5 ${
                          p.status === "draft"
                            ? "bg-zinc-50 text-zinc-600 ring-zinc-300"
                            : p.status === "archived"
                              ? "bg-red-50 text-red-600 ring-red-200"
                              : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        }`}
                      >
                        {p.status === "draft"
                          ? "Rascunho"
                          : p.status === "archived"
                            ? "Arquivado"
                            : "Publicado"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 flex flex-col items-center">
                <Package className="h-8 w-8 mb-2 text-zinc-300" />
                <p>Nenhum produto cadastrado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recentes Leads */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">Últimos Pedidos</h2>
            <Link
              to="/admin/pedidos"
              className="text-sm font-medium text-[#D91672] hover:text-pink-600 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 p-0">
            {recentLeads.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {recentLeads.map((l) => {
                  const statusConfig: Record<
                    string,
                    { bg: string; text: string; ring: string; label: string }
                  > = {
                    iniciado: {
                      bg: "bg-blue-50",
                      text: "text-blue-700",
                      ring: "ring-blue-600/20",
                      label: "Aguardando",
                    },
                    confirmado: {
                      bg: "bg-emerald-50",
                      text: "text-emerald-700",
                      ring: "ring-emerald-600/20",
                      label: "Confirmado",
                    },
                    cancelado: {
                      bg: "bg-red-50",
                      text: "text-red-600",
                      ring: "ring-red-200",
                      label: "Cancelado",
                    },
                  };
                  const sc = statusConfig[l.status] || statusConfig.iniciado;
                  const itemCount = Array.isArray(l.items) ? l.items.length : 0;
                  return (
                    <div
                      key={l.id}
                      className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">
                          {l.customer_name || "Anônimo"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {l.customer_phone || "Sem telefone"}
                          {itemCount > 0 && ` · ${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-zinc-900">
                          {formatCurrency(l.subtotal)}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full ${sc.bg} px-2 py-0.5 text-[10px] font-medium ${sc.text} ring-1 ring-inset ${sc.ring}`}
                        >
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 flex flex-col items-center">
                <ShoppingCart className="h-8 w-8 mb-2 text-zinc-300" />
                <p>Nenhum pedido registrado ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
