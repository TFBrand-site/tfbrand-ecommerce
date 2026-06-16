import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      // Se não tem sessão e não está na tela de login, redireciona
      if (!session && window.location.pathname !== "/admin/login") {
        router.navigate({ to: "/admin/login", replace: true });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && window.location.pathname !== "/admin/login") {
        router.navigate({ to: "/admin/login", replace: true });
      } else if (session && window.location.pathname === "/admin/login") {
        router.navigate({ to: "/admin", replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  // Se for a tela de login, não mostra sidebar, apenas o formulário
  if (window.location.pathname === "/admin/login") {
    return <Outlet />;
  }

  // Se não estiver logado e chegou aqui (fallback), retorna null (será redirecionado)
  if (!session) return null;

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar simples por enquanto */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight text-pink-500">TFBrand Admin</h2>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-4">
          <a href="/admin" className="block rounded-md bg-slate-800 px-3 py-2 text-sm font-medium">
            Dashboard
          </a>
          <a
            href="/admin/produtos"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Produtos
          </a>
          <a
            href="/admin/categorias"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Categorias
          </a>
          <a
            href="/admin/pedidos"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Pedidos
          </a>
          <a
            href="/admin/configuracoes"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Configurações
          </a>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        {/* Header Mobile Omitido por brevidade por enquanto */}
        <div className="md:hidden p-4 bg-slate-900 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold text-pink-500">TFBrand Admin</h2>
          <button onClick={() => supabase.auth.signOut()} className="text-sm">
            Sair
          </button>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
