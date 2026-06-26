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
  Loader2,
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
import { useAdminRole } from "@/hooks/useAdminRole";

export const Route = createFileRoute("/admin/pedidos")({
  loader: async () => {
    if (!isSupabaseConfigured()) return { leads: [] };
    const leads = await getLeads();
    return { leads };
  },
  component: AdminPedidos,
});

function AdminPedidos() {
  const { role, loading: roleLoading } = useAdminRole();
  const { leads: initialLeads } = Route.useLoaderData();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (roleLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#D91672]" />
          <p className="text-sm text-zinc-500">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-white rounded-xl border border-zinc-200 p-8 shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-zinc-900">Acesso Negado</h2>
        <p className="text-zinc-500 text-center max-w-sm">
          Você não possui permissões de Administrador para acessar a seção de Pedidos & Leads.
        </p>
      </div>
    );
  }

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
          {/* Desktop Table View */}
          <table className="w-full text-sm text-left hidden md:table">
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

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-zinc-100">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 hover:bg-zinc-50 transition-colors cursor-pointer flex flex-col gap-3"
                onClick={() => {
                  setSelectedLead(lead);
                  setDrawerOpen(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900 text-[15px]">
                      #{lead.id.substring(0, 6).toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div>{getStatusBadge(lead.status)}</div>
                </div>

                <div className="flex justify-between items-end mt-1">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">
                      {lead.customer_name || "Não informado"}
                    </span>
                    <span className="text-sm text-zinc-500">{lead.customer_phone || "-"}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-zinc-900">{formatCurrency(lead.subtotal)}</span>
                    <div className="flex items-center text-xs text-[#D91672] font-semibold">
                      Detalhes <ChevronRight className="h-3 w-3 ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {leads.length === 0 && (
              <div className="px-6 py-12 text-center text-zinc-500 flex flex-col items-center justify-center">
                <AlertCircle className="h-10 w-10 text-zinc-300 mb-3" />
                <p className="font-medium text-zinc-900">Nenhum pedido encontrado</p>
                <p className="text-sm mt-1">Os carrinhos enviados via WhatsApp aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer com Detalhes */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh] bg-zinc-50 flex flex-col">
          {selectedLead && (
            <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 overflow-hidden min-h-0">
              <DrawerHeader className="border-b border-zinc-200 bg-white shrink-0">
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

              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
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
                        <div
                          key={idx}
                          className="p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                          <div className="flex items-center gap-4 flex-1">
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
                              <h4 className="font-medium text-zinc-900 line-clamp-2">
                                {item.name}
                              </h4>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {item.color && <span className="mr-2">Cor: {item.color}</span>}
                                {item.size && <span>Tamanho: {item.size}</span>}
                              </p>
                              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                Ref: {item.sku}
                              </p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right mt-2 sm:mt-0 pl-20 sm:pl-0">
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
                <div className="flex items-center gap-2 text-xs text-zinc-400 justify-center pb-2">
                  <Smartphone className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-center">Origem: Site (Checkout)</span>
                </div>
              </div>

              <DrawerFooter className="bg-white border-t border-zinc-200 flex flex-col sm:flex-row gap-3 shrink-0 p-4">
                {selectedLead.status === "iniciado" && (
                  <>
                    <Button
                      className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12"
                      onClick={() => handleUpdateStatus(selectedLead.id, "confirmado")}
                    >
                      Marcar Confirmado
                    </Button>
                    <Button
                      className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white h-12"
                      onClick={() => handleUpdateStatus(selectedLead.id, "cancelado")}
                    >
                      Marcar Cancelado
                    </Button>
                  </>
                )}
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full sm:flex-1 h-12">
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
