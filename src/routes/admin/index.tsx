import { createFileRoute } from "@tanstack/react-router";
import { getAdminProducts, migrateMocksToSupabase } from "@/lib/services/products.service";
import { getCategories } from "@/lib/services/categories.service";
import { getEventStats } from "@/lib/services/analytics.service";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    try {
      const [products, categories, stats] = await Promise.all([
        getAdminProducts(),
        getCategories(true),
        getEventStats(),
      ]);
      return { products, categories, stats };
    } catch (error) {
      console.error("Erro no loader do dashboard:", error);
      return { products: [], categories: [], stats: { views: 0, cartAdds: 0, whatsappClicks: 0 } };
    }
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const { products, categories, stats } = Route.useLoaderData();
  const [migrating, setMigrating] = useState(false);
  const configured = isSupabaseConfigured();

  const handleMigrate = async () => {
    if (!confirm("Isso vai inserir todos os produtos do mock no banco. Deseja continuar?")) return;
    setMigrating(true);
    try {
      await migrateMocksToSupabase();
      toast.success("Dados migrados com sucesso!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao migrar dados. Veja o console.");
    } finally {
      setMigrating(false);
    }
  };

  const lancamentos = products.filter((p) => p.is_new).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo ao painel administrativo da TFBrand.
          </p>
        </div>

        {configured && products.length === 0 && (
          <Button
            onClick={handleMigrate}
            disabled={migrating}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            {migrating ? "Migrando..." : "Migrar Mocks para o Banco"}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total de Produtos</h3>
          </div>
          <div className="text-2xl font-bold">{products.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Produtos cadastrados no banco</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Pedidos Iniciados</h3>
          </div>
          <div className="text-2xl font-bold">{stats.whatsappClicks}</div>
          <p className="text-xs text-muted-foreground mt-1">Cliques pro WhatsApp</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Categorias</h3>
          </div>
          <div className="text-2xl font-bold">{categories.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Ativas no site</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Lançamentos</h3>
          </div>
          <div className="text-2xl font-bold">{lancamentos}</div>
          <p className="text-xs text-muted-foreground mt-1">Produtos marcados como novo</p>
        </div>
      </div>

      {!configured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 mt-8">
          <h3 className="font-semibold text-lg mb-2">Configuração do Banco de Dados Pendente</h3>
          <p className="text-sm">
            Para que o painel funcione com dados reais e salve suas alterações, certifique-se de
            executar o script SQL no seu projeto Supabase e adicionar as credenciais no arquivo{" "}
            <code>.env</code>.
          </p>
        </div>
      )}
    </div>
  );
}
