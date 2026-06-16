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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">Gerencie as informações principais da loja.</p>
      </div>

      <div className="border rounded-xl bg-white shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Loja</label>
            <input
              required
              value={formData.store_name || ""}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Número do WhatsApp (apenas números)</label>
            <input
              required
              value={formData.whatsapp_number || ""}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="Ex: 5511999999999"
            />
            <p className="text-xs text-slate-500">
              Usado para receber pedidos pelo botão de comprar.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL do Instagram</label>
            <input
              required
              value={formData.instagram_url || ""}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="Ex: https://instagram.com/tfbrand"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              E-mail Técnico (Não alterar sem necessidade)
            </label>
            <input
              value={formData.tech_email || ""}
              onChange={(e) => setFormData({ ...formData, tech_email: e.target.value })}
              className="w-full p-2 border rounded-md bg-slate-50"
              readOnly
            />
          </div>

          <div className="pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto"
            >
              {loading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
