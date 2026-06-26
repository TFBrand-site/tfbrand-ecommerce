/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  getStoreSettings,
  updateStoreSettings,
  type StoreSettings,
} from "@/lib/services/settings.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Settings, MessageCircle, Instagram } from "lucide-react";

export const Route = createFileRoute("/admin/configuracoes")({
  loader: async () => {
    const settings = await getStoreSettings();
    return { settings };
  },
  component: AdminConfiguracoes,
});

function AdminConfiguracoes() {
  const { settings } = Route.useLoaderData();
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"geral" | "integracoes">("geral");
  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      toast.error("Configure o Supabase para salvar as configurações.");
      return;
    }

    setLoading(true);
    try {
      const updated = await updateStoreSettings({
        store_name: formData.store_name,
        whatsapp_number: formData.whatsapp_number,
        instagram_url: formData.instagram_url,
        tech_email: formData.tech_email,
      });
      setFormData(updated);
      toast.success("Configurações salvas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "geral", label: "Geral", icon: Settings },
    { id: "integracoes", label: "Integrações", icon: MessageCircle },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Configurações da Loja</h1>
        <p className="text-zinc-500 mt-1">
          Gerencie as informações principais, integrações e preferências da sua loja.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#D91672]/10 text-[#D91672]"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <tab.icon
                  className={`h-5 w-5 ${activeTab === tab.id ? "text-[#D91672]" : "text-zinc-400"}`}
                />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <div className="flex-1">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="p-6 sm:p-8 space-y-8">
                {/* Tab: Geral */}
                {activeTab === "geral" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 mb-4">Informações Básicas</h2>
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-700">Nome da Loja</label>
                          <input
                            required
                            value={formData.store_name || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, store_name: e.target.value })
                            }
                            className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-colors"
                            placeholder="Ex: TFBrand"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                            E-mail Técnico
                            <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded uppercase tracking-wider">
                              Sistema
                            </span>
                          </label>
                          <input
                            value={formData.tech_email || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, tech_email: e.target.value })
                            }
                            className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-500 cursor-not-allowed"
                            readOnly
                          />
                          <p className="text-xs text-zinc-500">
                            E-mail utilizado para alertas de sistema. Não deve ser alterado sem
                            orientação técnica.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Integrações */}
                {activeTab === "integracoes" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-[#25D366]" />
                        WhatsApp
                      </h2>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">
                          Número de Atendimento
                        </label>
                        <input
                          required
                          value={formData.whatsapp_number || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, whatsapp_number: e.target.value })
                          }
                          className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-colors"
                          placeholder="Ex: 5585999999999"
                        />
                        <p className="text-xs text-zinc-500 mt-1">
                          Insira apenas números com código do país (55) e DDD. Este número receberá
                          os pedidos do checkout.
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100">
                      <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-[#E1306C]" />
                        Instagram
                      </h2>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">URL do Perfil</label>
                        <input
                          required
                          value={formData.instagram_url || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, instagram_url: e.target.value })
                          }
                          className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-colors"
                          placeholder="Ex: https://instagram.com/tfbrand"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Form */}
              <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#D91672] hover:bg-[#c11363] text-white px-8"
                >
                  {loading ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
