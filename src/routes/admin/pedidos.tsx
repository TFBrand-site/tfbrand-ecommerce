import { createFileRoute } from "@tanstack/react-router";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/pedidos")({
  loader: async () => {
    if (!isSupabaseConfigured()) return { events: [] };

    // Buscar eventos de whatsapp_click com dados do produto
    const { data, error } = await supabase
      .from("analytics_events")
      .select(
        `
        *,
        product:products(name, sku, price)
      `,
      )
      .eq("event_type", "whatsapp_click")
      .order("created_at", { ascending: false });

    if (error) console.error("Erro ao carregar leads:", error);
    return { events: data || [] };
  },
  component: AdminPedidos,
});

function AdminPedidos() {
  const { events } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads e Pedidos</h1>
        <p className="text-muted-foreground mt-2">
          Histórico de clientes que clicaram para finalizar a compra no WhatsApp.
        </p>
      </div>

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Data / Hora</th>
                <th className="px-6 py-3 font-medium">Produto de Interesse</th>
                <th className="px-6 py-3 font-medium">Dispositivo</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev: any) => (
                <tr key={ev.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(ev.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4">
                    {ev.product ? (
                      <div>
                        <p className="font-medium">{ev.product.name}</p>
                        <p className="text-xs text-slate-500">Ref: {ev.product.sku}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">Carrinho completo / Desconhecido</span>
                    )}
                  </td>
                  <td
                    className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate"
                    title={ev.user_agent}
                  >
                    {ev.user_agent || "Desconhecido"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Redirecionado ao WhatsApp
                    </span>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Nenhum registro encontrado.
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
