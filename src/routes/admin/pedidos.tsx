/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLeads, updateLeadStatus, type Lead } from "@/lib/services/leads.service";
import {
  ShoppingBag,
  Search,
  ChevronRight,
  MessageCircle,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pedidos")({
  loader: async () => {
    if (!isSupabaseConfigured()) return { leads: [] };
    const leads = await getLeads();
    return { leads };
  },
  component: AdminPedidos,
});

function AdminPedidos() {
  const { leads: initialLeads } = Route.useLoaderData();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleUpdateStatus = async (
    id: string,
    status: "iniciado" | "confirmado" | "cancelado",
  ) => {
    try {
      await updateLeadStatus(id, status);
      setLeads(leads.map((l) => (l.id === id ? { ...l, status } : l)));
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead({ ...selectedLead, status });
      }
      toast.success("Status do pedido atualizado!");
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmado":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            Confirmado
          </span>
        );
      case "cancelado":
        return (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
            Aguardando Contato
          </span>
        );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Pedidos & Leads</h1>
          <p className="text-zinc-500 mt-1">Clientes que enviaram o carrinho via WhatsApp.</p>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 flex items-center gap-4 bg-zinc-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">ID / Data</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Cliente</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-right">Valor</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-zinc-50/50 transition-colors group cursor-pointer"
                  onClick={() => {
                    setSelectedLead(lead);
                    setDrawerOpen(true);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900">
                        #{lead.id.substring(0, 6).toUpperCase()}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900">
                        {lead.customer_name || "Não informado"}
                      </span>
                      <span className="text-xs text-zinc-500">{lead.customer_phone || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-zinc-900">
                    {formatCurrency(lead.subtotal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(lead.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-zinc-400 hover:text-[#D91672] p-2 transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-10 w-10 text-zinc-300 mb-3" />
                      <p className="font-medium text-zinc-900">Nenhum pedido encontrado</p>
                      <p className="text-sm mt-1">
                        Os carrinhos enviados via WhatsApp aparecerão aqui.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer com Detalhes */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh] bg-zinc-50">
          {selectedLead && (
            <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
              <DrawerHeader className="border-b border-zinc-200 bg-white">
                <DrawerTitle className="text-2xl font-bold flex items-center justify-between">
                  <span>Pedido #{selectedLead.id.substring(0, 8).toUpperCase()}</span>
                  {getStatusBadge(selectedLead.status)}
                </DrawerTitle>
                <DrawerDescription>
                  Realizado em{" "}
                  {format(new Date(selectedLead.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </DrawerDescription>
              </DrawerHeader>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Cliente Info */}
                <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      Cliente
                    </h3>
                    <p className="font-medium text-zinc-900 text-lg">
                      {selectedLead.customer_name || "Não informado"}
                    </p>
                    <p className="text-zinc-500 text-sm">{selectedLead.customer_phone || "-"}</p>
                  </div>
                  {selectedLead.customer_phone && (
                    <a
                      href={`https://wa.me/55${selectedLead.customer_phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1ebd57] transition-colors h-fit"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Abrir WhatsApp
                    </a>
                  )}
                </div>

                {/* Itens */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#D91672]" />
                    <h3 className="font-bold text-zinc-900">Itens do Pedido</h3>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {Array.isArray(selectedLead.items) &&
                      selectedLead.items.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 flex items-center gap-4">
                          {item.image && (
                            <div className="h-16 w-16 rounded-md border border-zinc-200 overflow-hidden shrink-0 bg-zinc-50">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-zinc-900 line-clamp-1">{item.name}</h4>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {item.color && <span className="mr-2">Cor: {item.color}</span>}
                              {item.size && <span>Tamanho: {item.size}</span>}
                            </p>
                            <p className="text-xs text-zinc-500 font-mono mt-0.5">
                              Ref: {item.sku}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-zinc-900">
                              {formatCurrency(item.price)}
                            </p>
                            <p className="text-xs text-zinc-500">Qtd: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center">
                    <span className="font-bold text-zinc-700">Total</span>
                    <span className="text-xl font-bold text-[#D91672]">
                      {formatCurrency(selectedLead.subtotal)}
                    </span>
                  </div>
                </div>

                {/* Info Técnica */}
                <div className="flex items-center gap-2 text-xs text-zinc-500 justify-center">
                  <Smartphone className="h-4 w-4" />
                  Origem: {selectedLead.origin || "Checkout WhatsApp"} |{" "}
                  {selectedLead.device_info || "Dispositivo Desconhecido"}
                </div>
              </div>

              <DrawerFooter className="bg-white border-t border-zinc-200 flex flex-row gap-3">
                {selectedLead.status === "iniciado" && (
                  <>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleUpdateStatus(selectedLead.id, "confirmado")}
                    >
                      Marcar como Confirmado
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleUpdateStatus(selectedLead.id, "cancelado")}
                    >
                      Marcar como Cancelado
                    </Button>
                  </>
                )}
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1">
                    Fechar
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
