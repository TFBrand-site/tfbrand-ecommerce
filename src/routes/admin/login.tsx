import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (
      container: string | HTMLElement,
      options: {
        sitekey: string;
        theme?: string;
        callback?: (token: string) => void;
        "error-callback"?: () => void;
        "expired-callback"?: () => void;
      },
    ) => string;
    remove: () => void;
    reset: () => void;
  };
  onloadTurnstileCallback?: () => void;
}

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaStatus, setCaptchaStatus] = useState<"verifying" | "success" | "error" | "expired">(
    "verifying",
  );
  const [turnstileToken, setTurnstileToken] = useState("");

  const router = useRouter();

  // Carregamento do widget real do Cloudflare Turnstile
  useEffect(() => {
    const win = window as unknown as TurnstileWindow;
    const renderWidget = () => {
      const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
      const isDev = import.meta.env.DEV;

      // Se for Produção e não tiver a chave, emitimos um erro crítico e bloqueamos a tela.
      if (!siteKey && !isDev) {
        setError(
          "Erro Crítico de Segurança: Turnstile não configurado. Acesso administrativo bloqueado.",
        );
        setCaptchaStatus("error");
        return;
      }

      // Usa a chave configurada ou a Dummy Key em ambiente local de dev.
      const finalSiteKey = siteKey || (isDev ? "1x00000000000000000000AA" : "");

      if (win.turnstile) {
        const container = document.getElementById("turnstile-container");
        if (container) {
          container.innerHTML = ""; // Limpa para evitar duplicados
        }
        try {
          win.turnstile.render("#turnstile-container", {
            sitekey: finalSiteKey,
            theme: "light",
            callback: (token: string) => {
              setTurnstileToken(token);
              setCaptchaStatus("success");
              setError(null);
            },
            "error-callback": () => {
              setCaptchaStatus("error");
              setError("Falha na verificação do navegador. Por favor, recarregue a página.");
            },
            "expired-callback": () => {
              setCaptchaStatus("expired");
              setTurnstileToken("");
              setError("O desafio de segurança expirou. Por favor, revalide.");
            },
          });
        } catch (e) {
          console.warn("Erro ao renderizar Turnstile:", e);
        }
      }
    };

    // Callback global para quando o script carregar pela primeira vez
    win.onloadTurnstileCallback = renderWidget;

    if (win.turnstile) {
      // Se a biblioteca já está carregada no window (ex: navegação SPA anterior), renderiza imediatamente
      renderWidget();
    } else {
      // Injeta o script se não estiver presente na página
      if (!document.getElementById("turnstile-script")) {
        const script = document.createElement("script");
        script.id = "turnstile-script";
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      // Limpeza ao desmontar
      delete win.onloadTurnstileCallback;
      try {
        if (win.turnstile) {
          win.turnstile.remove();
        }
      } catch (e) {
        // Ignora erros ao limpar
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaStatus !== "success" || loading) return;

    setLoading(true);
    setError(null);

    const win = window as unknown as TurnstileWindow;

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // Envia o token de captcha se configurado no Supabase
          captchaToken: turnstileToken || undefined,
        },
      });

      if (authError) throw authError;

      if (data.user) {
        // Verifica se a conta do usuário tem MFA (2FA) configurado e ativo
        const { data: mfaData, error: mfaListError } = await supabase.auth.mfa.listFactors();
        if (mfaListError) throw mfaListError;

        const activeTotpFactor = mfaData?.totp?.find((f) => f.status === "verified");

        if (activeTotpFactor) {
          // Redireciona imediatamente para a rota isolada de MFA
          router.navigate({ to: "/admin/mfa", replace: true });
          return;
        }
      }

      // Se não possui MFA ativo, entra direto no painel
      router.navigate({ to: "/admin", replace: true });
    } catch (err: unknown) {
      // Importante: resetar o widget do Turnstile após uma falha de autenticação
      // para que um novo token seja gerado na próxima tentativa, evitando erro de duplicidade.
      if (win.turnstile) {
        try {
          win.turnstile.reset();
        } catch (resetErr) {
          console.warn("Erro ao resetar Turnstile:", resetErr);
        }
      }
      setTurnstileToken("");
      setCaptchaStatus("verifying");

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

  // Render do formulário de login padrão (E-mail e Senha)
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

          {/* Cloudflare Turnstile Container */}
          <div className="flex w-full justify-center mt-1 mb-2">
            <div id="turnstile-container" className="min-h-[65px]"></div>
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
