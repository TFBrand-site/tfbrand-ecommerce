import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaStatus, setCaptchaStatus] = useState<"verifying" | "success">("verifying");
  const router = useRouter();

  // Simulação do Cloudflare Turnstile com delay para segurança visual
  useEffect(() => {
    const timer = setTimeout(() => {
      setCaptchaStatus("success");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaStatus !== "success" || loading) return;

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      router.navigate({ to: "/admin" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Mensagem segura genérica para evitar enumeração de contas
        if (err.message.includes("Invalid login credentials") || err.message.includes("400")) {
          setError("E-mail corporativo ou senha incorretos.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Ocorreu um erro ao autenticar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-tr from-[#FFF2F5] via-[#FFFDFD] to-[#FDF6F8] px-4 py-12 font-sans select-none">
      <div className="w-full max-w-[420px] bg-white border border-zinc-100/80 shadow-xl shadow-pink-100/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img src="/images/logo.png" alt="TF Brand Logo" className="h-10 w-auto object-contain" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold tracking-tight text-zinc-800 mb-1">
            Acesso Administrativo
          </h2>
          <p className="text-sm text-zinc-500">Entre com suas credenciais corporativas</p>
        </div>

        <form className="w-full flex flex-col gap-4" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 text-center font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </div>
          )}

          {/* E-mail Input */}
          <div className="relative flex items-center">
            <Mail className="absolute left-4 h-5 w-5 text-zinc-400" strokeWidth={1.5} />
            <input
              name="email"
              type="email"
              required
              disabled={loading}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-4 pl-12 pr-4 text-[15px] text-zinc-800 placeholder-zinc-400 transition-all focus:border-[#D91672] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D91672] disabled:opacity-60"
              placeholder="E-mail corporativo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Senha Input */}
          <div className="relative flex items-center">
            <Lock className="absolute left-4 h-5 w-5 text-zinc-400" strokeWidth={1.5} />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={loading}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-4 pl-12 pr-12 text-[15px] text-zinc-800 placeholder-zinc-400 transition-all focus:border-[#D91672] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D91672] disabled:opacity-60"
              placeholder="Senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-zinc-400 hover:text-zinc-600 focus:outline-none disabled:opacity-60"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <Eye className="h-5 w-5" strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* Lembrar-me */}
          <div className="flex items-center mt-1 mb-1">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-[#D91672] focus:ring-[#D91672] focus:ring-offset-2 cursor-pointer transition-colors"
            />
            <label
              htmlFor="remember"
              className="ml-3 text-[14px] text-zinc-500 font-medium cursor-pointer hover:text-zinc-700 transition-colors"
            >
              Lembrar-me neste dispositivo
            </label>
          </div>

          {/* Cloudflare Turnstile Simulator */}
          <div className="flex w-full items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 mt-1 mb-1 transition-all select-none">
            {captchaStatus === "verifying" ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-[#D91672] animate-spin" />
                <span className="text-xs font-semibold text-zinc-500 animate-pulse">
                  Verificando segurança...
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" strokeWidth={2} />
                </div>
                <span className="text-xs font-bold text-emerald-600">Navegador verificado</span>
              </div>
            )}
            <div className="flex flex-col items-end leading-none">
              <span className="text-[9px] font-extrabold text-zinc-400 tracking-wider uppercase">
                CLOUDFLARE
              </span>
              <span className="text-[8px] text-zinc-400 hover:underline cursor-pointer mt-0.5">
                Privacidade • Ajuda
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || captchaStatus !== "success"}
            className="mt-4 flex w-full justify-center items-center gap-2 rounded-xl bg-[#D91672] py-4 text-[15px] font-bold text-white transition-all hover:bg-[#be1061] focus:outline-none focus:ring-2 focus:ring-[#D91672] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Autenticando...
              </>
            ) : (
              "Acessar Painel"
            )}
          </button>
        </form>

        {/* Back Link */}
        <a
          href="/"
          className="mt-8 flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-[#D91672] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          Voltar ao Portal
        </a>
      </div>
    </div>
  );
}
