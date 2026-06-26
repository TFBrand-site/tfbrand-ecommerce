import { createFileRoute, Outlet, redirect, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Settings,
  ExternalLink,
  User,
  Menu,
  X,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

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

  if (window.location.pathname === "/admin/login") {
    return <Outlet />;
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-zinc-200 text-zinc-900 flex-col hidden md:flex shrink-0">
        <div className="p-6 flex items-center justify-start border-b border-zinc-100 h-16">
          {/* Logo */}
          <img src="/images/logo.png" alt="TF Brand Logo" className="h-9 w-auto object-contain" />
        </div>

        <nav className="flex-1 flex flex-col pt-4">
          <div className="text-[11px] font-bold tracking-wider text-slate-700 mb-2 mt-4 px-6 uppercase">
            Painel
          </div>
          <Link to="/admin" activeOptions={{ exact: true }}>
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 pl-6 pr-4 py-2.5 text-[13px] font-semibold transition-colors rounded-r-full mr-4 relative cursor-pointer ${
                  isActive ? "bg-[#FDF2F8] text-[#D91672]" : "text-slate-600 hover:bg-zinc-50"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D91672] rounded-r-md" />
                )}
                <LayoutDashboard className="w-[18px] h-[18px]" />
                Dashboard
              </div>
            )}
          </Link>

          <div className="text-[11px] font-bold tracking-wider text-slate-700 mb-2 mt-6 px-6 uppercase">
            Catálogo
          </div>
          <Link to="/admin/produtos">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 pl-6 pr-4 py-2.5 text-[13px] font-semibold transition-colors rounded-r-full mr-4 relative cursor-pointer ${
                  isActive ? "bg-[#FDF2F8] text-[#D91672]" : "text-slate-600 hover:bg-zinc-50"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D91672] rounded-r-md" />
                )}
                <Package className="w-[18px] h-[18px]" />
                Produtos
              </div>
            )}
          </Link>
          <Link to="/admin/categorias">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 pl-6 pr-4 py-2.5 text-[13px] font-semibold transition-colors rounded-r-full mr-4 relative cursor-pointer ${
                  isActive ? "bg-[#FDF2F8] text-[#D91672]" : "text-slate-600 hover:bg-zinc-50"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D91672] rounded-r-md" />
                )}
                <Tags className="w-[18px] h-[18px]" />
                Categorias
              </div>
            )}
          </Link>

          <div className="text-[11px] font-bold tracking-wider text-slate-700 mb-2 mt-6 px-6 uppercase">
            Vendas
          </div>
          <Link to="/admin/pedidos">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 pl-6 pr-4 py-2.5 text-[13px] font-semibold transition-colors rounded-r-full mr-4 relative cursor-pointer ${
                  isActive ? "bg-[#FDF2F8] text-[#D91672]" : "text-slate-600 hover:bg-zinc-50"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D91672] rounded-r-md" />
                )}
                <ShoppingCart className="w-[18px] h-[18px]" />
                Pedidos
              </div>
            )}
          </Link>

          <div className="text-[11px] font-bold tracking-wider text-slate-700 mb-2 mt-6 px-6 uppercase">
            Sistema
          </div>
          <Link to="/admin/configuracoes">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 pl-6 pr-4 py-2.5 text-[13px] font-semibold transition-colors rounded-r-full mr-4 relative cursor-pointer ${
                  isActive ? "bg-[#FDF2F8] text-[#D91672]" : "text-slate-600 hover:bg-zinc-50"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D91672] rounded-r-md" />
                )}
                <Settings className="w-[18px] h-[18px]" />
                Configurações
              </div>
            )}
          </Link>
        </nav>

        <div className="p-4 mt-auto border-t border-zinc-100">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 pl-2 pr-4 py-2.5 text-[13px] font-semibold text-slate-600 hover:text-zinc-950 transition-colors"
          >
            <ExternalLink className="w-[18px] h-[18px]" />
            Ver Loja
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full mt-2 rounded-md border border-zinc-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-zinc-50 hover:text-zinc-950 transition cursor-pointer"
          >
            Sair do painel
          </button>
        </div>
      </aside>

      {/* Sidebar Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="relative w-64 max-w-xs bg-white h-full flex flex-col z-50 animate-in slide-in-from-left duration-250">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between h-16">
              <img
                src="/images/logo.png"
                alt="TF Brand Logo"
                className="h-8 w-auto object-contain"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-900 focus:outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col pt-4 overflow-y-auto">
              <div className="text-[11px] font-bold tracking-wider text-slate-700 mb-2 mt-4 px-6 uppercase">
                Painel
              </div>
              <Link
                to="/admin"
                activeOptions={{ exact: true }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-3 pl-6 pr-4 py-2.5 text-[13px] font-semibold transition-colors rounded-r-full mr-4 relative cursor-pointer ${
                      isActive ? "bg-[#FDF2F8] text-[#D91672]" : "text-slate-600 hover:bg-zinc-50"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D91672] rounded-r-md" />
                    )}
                    <LayoutDashboard className="w-[18px] h-[18px]" />
                    Dashboard
                  </div>
                )}
              </Link>

              <div className="text-[11px] font-bold tracking-wider text-slate-700 mb-2 mt-6 px-6 uppercase">
                Catálogo
              </div>
              <Link to="/admin/produtos" onClick={() => setIsMobileMenuOpen(false)}>
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-3 pl-6 pr-4 py-2.5 text-[13px] font-semibold transition-colors rounded-r-full mr-4 relative cursor-pointer ${
                      isActive ? "bg-[#FDF2F8] text-[#D91672]" : "text-slate-600 hover:bg-zinc-50"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D91672] rounded-r-md" />
                    )}
                    <Package className="w-[18px] h-[18px]" />
                    Produtos
                  </div>
                )}
              </Link>
              <Link to="/admin/categorias" onClick={() => setIsMobileMenuOpen(false)}>
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-3 pl-6 pr-4 py-2.5 text-[13px] font-semibold transition-colors rounded-r-full mr-4 relative cursor-pointer ${
                      isActive ? "bg-[#FDF2F8] text-[#D91672]" : "text-slate-600 hover:bg-zinc-50"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D91672] rounded-r-md" />
                    )}
                    <Tags className="w-[18px] h-[18px]" />
                    Categorias
                  </div>
                )}
              </Link>

              <div className="text-[11px] font-bold tracking-wider text-slate-700 mb-2 mt-6 px-6 uppercase">
                Vendas
              </div>
              <Link to="/admin/pedidos" onClick={() => setIsMobileMenuOpen(false)}>
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-3 pl-6 pr-4 py-2.5 text-[13px] font-semibold transition-colors rounded-r-full mr-4 relative cursor-pointer ${
                      isActive ? "bg-[#FDF2F8] text-[#D91672]" : "text-slate-600 hover:bg-zinc-50"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D91672] rounded-r-md" />
                    )}
                    <ShoppingCart className="w-[18px] h-[18px]" />
                    Pedidos
                  </div>
                )}
              </Link>

              <div className="text-[11px] font-bold tracking-wider text-slate-700 mb-2 mt-6 px-6 uppercase">
                Sistema
              </div>
              <Link to="/admin/configuracoes" onClick={() => setIsMobileMenuOpen(false)}>
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-3 pl-6 pr-4 py-2.5 text-[13px] font-semibold transition-colors rounded-r-full mr-4 relative cursor-pointer ${
                      isActive ? "bg-[#FDF2F8] text-[#D91672]" : "text-slate-600 hover:bg-zinc-50"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#D91672] rounded-r-md" />
                    )}
                    <Settings className="w-[18px] h-[18px]" />
                    Configurações
                  </div>
                )}
              </Link>
            </nav>

            <div className="p-4 mt-auto border-t border-zinc-100 bg-zinc-50">
              <Link
                to="/"
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 pl-2 pr-4 py-2.5 text-[13px] font-semibold text-slate-600 hover:text-zinc-950 transition-colors"
              >
                <ExternalLink className="w-[18px] h-[18px]" />
                Ver Loja
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  supabase.auth.signOut();
                }}
                className="w-full mt-2 rounded-md border border-zinc-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-zinc-100 transition cursor-pointer"
              >
                Sair do painel
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Area */}
      <main className="flex-1 overflow-hidden bg-[#F8F9FA] flex flex-col">
        {/* Header Desktop */}
        <header className="hidden md:flex shrink-0 h-16 bg-white border-b border-zinc-200 items-center justify-between px-8">
          <h1 className="text-[14px] font-bold text-zinc-800 capitalize">
            {window.location.pathname.split("/").pop() === "admin"
              ? "Dashboard"
              : window.location.pathname.split("/").pop()}
          </h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full hover:bg-red-50 hover:border-red-100 hover:text-red-600 text-zinc-500 transition-all cursor-pointer group"
            title="Clique para Sair"
          >
            <User className="w-[14px] h-[14px] text-zinc-400 group-hover:text-red-500 transition-colors" />
            <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-red-600 transition-colors">
              {session.user?.email || "admin@tfbrand.com"}
            </span>
          </button>
        </header>

        {/* Header Mobile */}
        <div className="md:hidden shrink-0 p-4 bg-white border-b border-zinc-200 text-zinc-900 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 -ml-1 text-zinc-600 hover:text-[#D91672] transition-colors focus:outline-none cursor-pointer"
              title="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <img src="/images/logo.png" alt="TF Brand Logo" className="h-8 w-auto object-contain" />
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full hover:bg-red-50 hover:border-red-100 hover:text-red-600 text-zinc-500 transition-all cursor-pointer group"
            title="Clique para Sair"
          >
            <User className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500 transition-colors" />
            <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-red-600 transition-colors truncate max-w-[110px]">
              {session.user?.email || "admin@tfbrand.com"}
            </span>
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
