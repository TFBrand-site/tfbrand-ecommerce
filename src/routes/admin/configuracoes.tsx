/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  getStoreSettings,
  updateStoreSettings,
  type StoreSettings,
} from "@/lib/services/settings.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  Settings,
  MessageCircle,
  Instagram,
  ShieldCheck,
  KeyRound,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";

export const Route = createFileRoute("/admin/configuracoes")({
  loader: async () => {
    const settings = await getStoreSettings();
    return { settings };
  },
  component: AdminConfiguracoes,
});

function AdminConfiguracoes() {
  const { role, loading: roleLoading } = useAdminRole();
  const { settings } = Route.useLoaderData();
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"geral" | "integracoes" | "seguranca">("geral");
  const configured = isSupabaseConfigured();

  // Estados para segurança (MFA)
  const [mfaActive, setMfaActive] = useState(false);
  const [mfaEnrollData, setMfaEnrollData] = useState<any>(null);
  const [mfaVerificationCode, setMfaVerificationCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);

  const checkMfaStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const active = data?.totp?.some((f) => f.status === "verified") || false;
      setMfaActive(active);
    } catch (err: any) {
      console.error("Erro ao obter status do MFA:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "seguranca") {
      checkMfaStatus();
    }
  }, [activeTab]);

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
          Você não possui permissões de Administrador para acessar a seção de Configurações da loja.
        </p>
      </div>
    );
  }

  const startMfaEnroll = async () => {
    setMfaLoading(true);
    setMfaError(null);
    try {
      // 1. Limpar tentativas anteriores que não foram concluídas (unverified)
      const { data: listData } = await supabase.auth.mfa.listFactors();
      const unverified = listData?.totp?.filter((f) => (f.status as string) === "unverified") || [];
      for (const factor of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      // 2. Iniciar novo cadastro
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "TFBrand",
        friendlyName: "Admin Principal",
      });
      if (error) throw error;
      setMfaEnrollData(data);
    } catch (err: any) {
      setMfaError(err.message || "Erro ao iniciar registro MFA.");
    } finally {
      setMfaLoading(false);
    }
  };

  const cancelMfaEnroll = async () => {
    if (!mfaEnrollData) return;
    setMfaLoading(true);
    try {
      await supabase.auth.mfa.unenroll({
        factorId: mfaEnrollData.id,
      });
      setMfaEnrollData(null);
      setMfaVerificationCode("");
      setMfaError(null);
    } catch (err) {
      console.error(err);
    } finally {
      setMfaLoading(false);
    }
  };

  const confirmMfaVerification = async () => {
    if (!mfaVerificationCode || mfaVerificationCode.length !== 6 || !mfaEnrollData) return;
    setMfaLoading(true);
    setMfaError(null);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaEnrollData.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaEnrollData.id,
        challengeId: challengeData.id,
        code: mfaVerificationCode,
      });
      if (verifyError) throw verifyError;

      toast.success("Autenticação em duas etapas (MFA) ativada com sucesso!");
      setMfaActive(true);
      setMfaEnrollData(null);
      setMfaVerificationCode("");
    } catch (err: any) {
      setMfaError(err.message || "Código inválido. Tente novamente.");
    } finally {
      setMfaLoading(false);
    }
  };

  const disableMfa = async () => {
    if (
      !window.confirm(
        "Tem certeza que deseja desativar a autenticação em duas etapas? Isso reduzirá a segurança da sua conta.",
      )
    )
      return;
    setMfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const activeFactor = data?.totp?.find((f) => f.status === "verified");
      if (activeFactor) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: activeFactor.id,
        });
        if (unenrollError) throw unenrollError;
        toast.success("MFA desativado com sucesso.");
        setMfaActive(false);
      }
    } catch (err: any) {
      toast.error("Erro ao desativar: " + err.message);
    } finally {
      setMfaLoading(false);
    }
  };

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
    { id: "seguranca", label: "Segurança", icon: ShieldCheck },
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

                {/* Tab: Segurança (MFA) */}
                {activeTab === "seguranca" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-left">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 mb-2 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#D91672]" />
                        Autenticação em Duas Etapas (MFA)
                      </h2>
                      <p className="text-sm text-zinc-500 mb-6 font-normal">
                        Adicione uma camada extra de segurança à sua conta administrativa. Quando
                        ativado, você precisará inserir um código temporário de 6 dígitos gerado no
                        aplicativo do seu celular para poder acessar o painel.
                      </p>

                      {mfaError && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 font-medium">
                          {mfaError}
                        </div>
                      )}

                      {/* Estado: Já Ativado */}
                      {mfaActive && !mfaEnrollData && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5 animate-pulse">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-emerald-900 text-sm sm:text-base">
                                MFA Ativado e Ativo
                              </h4>
                              <p className="text-xs sm:text-sm text-emerald-700 mt-0.5 font-normal">
                                Sua conta está protegida por verificação em duas etapas por
                                aplicativo de autenticação.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={disableMfa}
                            disabled={mfaLoading}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl px-5 py-2.5 text-xs font-bold transition-all disabled:opacity-60 cursor-pointer self-start sm:self-center"
                          >
                            {mfaLoading ? "Desativando..." : "Desativar MFA"}
                          </button>
                        </div>
                      )}

                      {/* Estado: Inativo - Pronto para Ativar */}
                      {!mfaActive && !mfaEnrollData && (
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#D91672]/10 flex items-center justify-center text-[#D91672] shrink-0 mt-0.5">
                              <KeyRound className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-zinc-800 text-sm sm:text-base">
                                MFA Inativo
                              </h4>
                              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 font-normal">
                                Ative a proteção em duas etapas para impedir acessos não autorizados
                                mesmo que descubram sua senha.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={startMfaEnroll}
                            disabled={mfaLoading}
                            className="bg-[#D91672] hover:bg-[#c11363] text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-all disabled:opacity-60 cursor-pointer self-start sm:self-center shadow-sm"
                          >
                            {mfaLoading ? "Iniciando..." : "Ativar MFA"}
                          </button>
                        </div>
                      )}

                      {/* Estado: Iniciou cadastro (MFA Enroll Data ativo) */}
                      {mfaEnrollData && (
                        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6">
                          <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                            <h4 className="font-bold text-zinc-800 text-base">
                              Configurar Aplicativo de Autenticação
                            </h4>
                            <button
                              type="button"
                              onClick={cancelMfaEnroll}
                              className="text-xs text-zinc-400 hover:text-zinc-600 font-semibold"
                            >
                              Cancelar
                            </button>
                          </div>

                          <div className="grid gap-6 md:grid-cols-[200px_1fr] items-start">
                            {/* QR Code Container */}
                            <div className="flex flex-col items-center gap-2 bg-zinc-50 p-3 rounded-xl border border-zinc-100 shrink-0">
                              <img
                                src={mfaEnrollData.totp.qr_code}
                                alt="QR Code MFA"
                                className="w-40 h-40 bg-white rounded-lg p-2 shadow-sm object-contain"
                              />
                              <span className="text-[10px] text-zinc-400 font-semibold select-none">
                                Escaneie este QR Code
                              </span>
                            </div>

                            {/* Instruções */}
                            <div className="space-y-4 text-zinc-600 text-sm">
                              <p className="font-medium text-zinc-800">
                                Siga o passo a passo para ativar:
                              </p>
                              <ol className="list-decimal pl-5 space-y-2 text-zinc-500 font-normal">
                                <li>
                                  Abra o Google Authenticator ou seu app de autenticação no celular.
                                </li>
                                <li>
                                  Toque no ícone de adicionar conta (+) e selecione "Ler código QR".
                                </li>
                                <li>Aponte a câmera para o código ao lado.</li>
                                <li>
                                  Se a câmera não ler, digite manualmente a chave secreta abaixo no
                                  app:
                                </li>
                              </ol>

                              {/* Chave Alfanumérica Secreta */}
                              <div className="flex flex-col gap-1.5 pt-1">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                  Chave Secreta Manual
                                </span>
                                <code className="block bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-mono font-bold tracking-wider text-zinc-700 select-all break-all">
                                  {mfaEnrollData.totp.secret}
                                </code>
                              </div>
                            </div>
                          </div>

                          {/* Campo de confirmação final */}
                          <div className="border-t border-zinc-100 pt-5 space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-zinc-700">
                                Código de Confirmação do Aplicativo
                              </label>
                              <input
                                type="text"
                                maxLength={6}
                                required
                                value={mfaVerificationCode}
                                onChange={(e) =>
                                  setMfaVerificationCode(e.target.value.replace(/\D/g, ""))
                                }
                                className="w-full max-w-[240px] block p-2.5 bg-white border border-zinc-300 rounded-lg text-center font-mono font-bold tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672]"
                                placeholder="000000"
                              />
                              <p className="text-xs text-zinc-400">
                                Insira o código de 6 dígitos gerado pelo aplicativo para confirmar a
                                ativação.
                              </p>
                            </div>

                            <div className="flex gap-3 justify-start pt-2">
                              <button
                                type="button"
                                onClick={confirmMfaVerification}
                                disabled={mfaLoading || mfaVerificationCode.length !== 6}
                                className="bg-[#D91672] hover:bg-[#c11363] text-white rounded-xl px-6 py-3 text-xs font-bold transition-all disabled:opacity-60 cursor-pointer shadow-sm flex items-center gap-1.5"
                              >
                                {mfaLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Confirmar e Ativar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Form */}
              {activeTab !== "seguranca" && (
                <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#D91672] hover:bg-[#c11363] text-white px-8"
                  >
                    {loading ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
