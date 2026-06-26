/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/mfa")({
  component: AdminMFA,
});

function AdminMFA() {
  const [code2FA, setCode2FA] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  const router = useRouter();

  // Verifica ao carregar a página se o usuário está logado e se precisa de MFA
  useEffect(() => {
    const checkMFA = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.navigate({ to: "/admin/login", replace: true });
        return;
      }

      try {
        const { data: mfaData, error: mfaListError } = await supabase.auth.mfa.listFactors();
        if (mfaListError) throw mfaListError;

        const activeTotpFactor = mfaData?.totp?.find((f) => f.status === "verified");

        if (!activeTotpFactor) {
          // Se não tem MFA ativo, não precisa estar aqui, vai direto para o admin
          router.navigate({ to: "/admin", replace: true });
          return;
        }

        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.currentLevel === "aal2") {
          // Se já validou o MFA (AAL2), manda para o dashboard
          router.navigate({ to: "/admin", replace: true });
          return;
        }

        // Fica na página aguardando o código para o fator encontrado
        setMfaFactorId(activeTotpFactor.id);
      } catch (err) {
        console.error("Erro ao verificar MFA:", err);
        setError("Erro ao verificar requisitos de segurança.");
      }
    };

    checkMFA();
  }, [router]);

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code2FA || code2FA.length !== 6 || loading || !mfaFactorId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Cria o desafio para o fator MFA
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });

      if (challengeError) throw challengeError;

      // 2. Verifica se o código inserido bate com o desafio do celular
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: code2FA,
      });

      if (verifyError) throw verifyError;

      // Sucesso na verificação MFA! Redireciona ao painel
      router.navigate({ to: "/admin", replace: true });
    } catch (err: any) {
      setError(err?.message || "Código de verificação incorreto ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/admin/login", replace: true });
  };

  if (!mfaFactorId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-tr from-[#FFF2F5] via-[#FFFDFD] to-[#FDF6F8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D91672]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-tr from-[#FFF2F5] via-[#FFFDFD] to-[#FDF6F8] px-4 py-12 font-sans select-none">
      <div className="w-full max-w-[420px] bg-white border border-zinc-100/80 shadow-xl shadow-pink-100/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img src="/images/logo.png" alt="TF Brand Logo" className="h-10 w-auto object-contain" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold tracking-tight text-zinc-800 mb-1">
            Código de Segurança
          </h2>
          <p className="text-sm text-zinc-500">
            Digite o código de 6 dígitos gerado pelo seu aplicativo de autenticação.
          </p>
        </div>

        <form className="w-full flex flex-col gap-4" onSubmit={handleMfaVerify}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 text-center font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </div>
          )}

          {/* Código MFA Input */}
          <div className="relative flex items-center">
            <ShieldCheck className="absolute left-4 h-5 w-5 text-zinc-400" strokeWidth={1.5} />
            <input
              type="text"
              maxLength={8}
              required
              disabled={loading}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-4 pl-12 pr-4 text-[17px] text-center font-mono font-bold tracking-widest text-zinc-800 placeholder-zinc-300 transition-all focus:border-[#D91672] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D91672] disabled:opacity-60"
              placeholder="000000"
              value={code2FA}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 6) setCode2FA(val);
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || code2FA.length !== 6}
            className="mt-4 flex w-full justify-center items-center gap-2 rounded-xl bg-[#D91672] py-4 text-[15px] font-bold text-white transition-all hover:bg-[#be1061] focus:outline-none focus:ring-2 focus:ring-[#D91672] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verificando...
              </>
            ) : (
              "Confirmar Acesso"
            )}
          </button>
        </form>

        {/* Botão de Cancelar e voltar ao login de e-mail */}
        <button
          onClick={handleLogout}
          className="mt-6 text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
        >
          Sair e voltar ao login principal
        </button>
      </div>
    </div>
  );
}
