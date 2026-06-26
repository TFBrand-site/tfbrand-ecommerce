import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Instagram, Search, ShoppingBag, Menu, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/bag-store";
import { useSearch } from "@/lib/search-store";
import { INSTAGRAM_URL, STORE_NAME, WHATSAPP_NUMBER, whatsappLink } from "@/lib/config";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function SearchAutocomplete({
  query,
  onSelect,
  hidden,
}: {
  query: string;
  onSelect: (val: string) => void;
  hidden?: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(query.trim().length > 1 && !hidden);
  }, [query, hidden]);

  if (!show) return null;

  const suggestions = Array.from(
    new Set([
      ...CATEGORIES.filter(
        (c) => c.label.toLowerCase().includes(query.toLowerCase()) && c.slug !== "lancamentos",
      ).map((c) => c.label),
      ...PRODUCTS.filter(
        (p) =>
          p.nome.toLowerCase().includes(query.toLowerCase()) ||
          p.categoria.toLowerCase().includes(query.toLowerCase()),
      ).map((p) => {
        const firstWord = p.nome.split(" ")[0];
        if (firstWord.toLowerCase().includes(query.toLowerCase())) return firstWord;
        if (p.categoria.toLowerCase().includes(query.toLowerCase())) {
          return p.categoria.charAt(0).toUpperCase() + p.categoria.slice(1);
        }
        return p.nome;
      }),
    ]),
  ).slice(0, 5);

  if (suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden">
      <ul className="flex flex-col py-1">
        {suggestions.map((sug, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelect(sug)}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-black transition-colors cursor-pointer flex items-center gap-2"
            >
              <Search className="h-3 w-3 text-zinc-400" />
              {sug}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface HeaderProps {
  // Mantida a prop apenas para não quebrar compatibilidade
  showCategories?: boolean;
}

const placeholders = ["vestidos", "conjuntos", "croppeds", "saias", "calças", "macacões"];

export function Header({ showCategories = false }: HeaderProps) {
  const { count, setOpen } = useCart();
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const [hideAutocomplete, setHideAutocomplete] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    setHideAutocomplete(true);
  }, [location.search]);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const pauseBeforeDelete = 2000;
    const pauseBeforeType = 500;

    const fullText = placeholders[placeholderIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting && currentPlaceholder === fullText) {
          setTimeout(() => setIsDeleting(true), pauseBeforeDelete);
        } else if (isDeleting && currentPlaceholder === "") {
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        } else {
          const nextChar = isDeleting
            ? fullText.substring(0, currentPlaceholder.length - 1)
            : fullText.substring(0, currentPlaceholder.length + 1);
          setCurrentPlaceholder(nextChar);
        }
      },
      isDeleting ? deletingSpeed : typingSpeed,
    );

    return () => clearTimeout(timeout);
  }, [currentPlaceholder, isDeleting, placeholderIndex]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHideAutocomplete(true);
    if (query.trim()) {
      navigate({
        to: "/produtos",
        search: (prev: Record<string, unknown>) => ({ ...prev, busca: query.trim() || undefined }),
      });
      setQuery("");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-45 flex flex-col w-full bg-[#FDF2F8]/95 backdrop-blur-md text-zinc-900 shadow-sm border-b border-pink-100">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:py-4">
          {/* Expanded Mobile Search */}
          {isSearchExpanded ? (
            <div className="flex w-full items-center gap-2 md:hidden animate-in fade-in slide-in-from-top-2">
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10 pointer-events-none" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setHideAutocomplete(false);
                    setQuery(e.target.value);
                  }}
                  className="w-full bg-zinc-100 border-zinc-200 text-zinc-900 rounded-full pl-9 h-10 focus-visible:ring-1 focus-visible:ring-zinc-300 placeholder:text-zinc-500 text-sm"
                  placeholder="O que você procura?"
                />
                <SearchAutocomplete
                  query={query}
                  hidden={hideAutocomplete}
                  onSelect={(val) => {
                    setHideAutocomplete(true);
                    setIsSearchExpanded(false);
                    navigate({
                      to: "/produtos",
                      search: (prev: Record<string, unknown>) => ({
                        ...prev,
                        busca: val || undefined,
                      }),
                    });
                    setQuery("");
                  }}
                />
              </form>
              <button
                onClick={() => setIsSearchExpanded(false)}
                className="p-2 text-zinc-500 hover:text-black transition-colors"
                aria-label="Fechar busca"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          ) : (
            <>
              {/* Menu Mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    className="md:hidden p-1 -ml-1 text-zinc-700 hover:text-black transition-colors"
                    aria-label="Menu Principal"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="bg-[#FDF2F8] border-r-pink-100 text-zinc-900 p-0 w-80"
                >
                  <SheetHeader className="p-4 border-b border-pink-100/50 text-left">
                    <SheetTitle className="text-zinc-900 flex items-center">
                      <img
                        src="/images/logo.png"
                        alt="TF Brand"
                        className="h-8 w-auto object-contain"
                      />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col py-4 px-4 gap-6 overflow-y-auto h-full pb-20">
                    <div className="flex flex-col gap-2 font-medium text-lg">
                      <Link
                        to="/"
                        className="text-zinc-700 hover:text-black py-2 [&.active]:text-[#D91672] [&.active]:font-bold"
                        activeOptions={{ exact: true }}
                      >
                        Início
                      </Link>
                      <Link
                        to="/produtos"
                        className="text-zinc-700 hover:text-black py-2 [&.active]:text-[#D91672] [&.active]:font-bold"
                        activeOptions={{ exact: true }}
                      >
                        Produtos
                      </Link>
                      <a
                        href="/#lancamentos"
                        className="text-zinc-700 hover:text-black py-2 transition-colors"
                      >
                        Lançamentos
                      </a>
                      <a
                        href="/#mais-vendidos"
                        className="text-zinc-700 hover:text-black py-2 transition-colors"
                      >
                        Mais Vendidos
                      </a>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <a href="/" className="shrink-0 md:mr-4" aria-label="TF Brand - Página inicial">
                <img
                  src="/images/logo.png"
                  alt="TF Brand"
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              </a>
              <nav className="hidden md:flex items-center gap-6 mr-4 text-sm font-medium text-zinc-700 shrink-0">
                <Link
                  to="/"
                  className="hover:text-black transition-colors [&.active]:text-[#D91672] [&.active]:font-bold"
                  activeOptions={{ exact: true }}
                >
                  Início
                </Link>

                <div className="group flex items-center py-1">
                  <Link
                    to="/produtos"
                    className="flex items-center gap-1 hover:text-black transition-colors [&.active]:text-[#D91672] [&.active]:font-bold"
                    activeOptions={{ exact: true }}
                  >
                    Produtos{" "}
                    <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />
                  </Link>

                  {/* Mega Menu Full Width Extension */}
                  <div className="absolute top-full left-0 w-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {/* Ponte transparente para não perder o hover */}
                    <div className="absolute -top-6 left-0 w-full h-6 bg-transparent"></div>
                    <div className="w-full bg-[#FDF2F8] border-t border-b border-pink-100 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.05)]">
                      <div className="mx-auto w-full max-w-7xl px-4 py-8 flex flex-col">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-5">
                          Categorias
                        </span>
                        <div className="flex flex-wrap gap-8">
                          <Link
                            to="/produtos"
                            className="text-[15px] font-medium text-zinc-600 hover:text-[#D91672] transition-colors"
                          >
                            Todos
                          </Link>
                          {CATEGORIES.filter((cat) => cat.slug !== "lancamentos").map((cat) => (
                            <Link
                              key={cat.slug}
                              to="/produtos"
                              search={{ categoria: cat.slug }}
                              className="text-[15px] font-medium text-zinc-600 hover:text-[#D91672] transition-colors"
                            >
                              {cat.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <a href="/#lancamentos" className="hover:text-black transition-colors">
                  Lançamentos
                </a>

                <a href="/#mais-vendidos" className="hover:text-black transition-colors">
                  Mais Vendidos
                </a>
              </nav>
              {/* Barra de busca */}
              <div className="relative flex-1 max-w-2xl ml-4 hidden md:block">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative w-full">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10" />
                    <Input
                      value={query}
                      onChange={(e) => {
                        setHideAutocomplete(false);
                        setQuery(e.target.value);
                      }}
                      className="h-10 rounded-full border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm text-zinc-900 focus:bg-white focus:border-zinc-300 focus-visible:ring-1 focus-visible:ring-zinc-200 transition-all duration-300 w-full placeholder:text-zinc-400"
                    />
                    {!query && (
                      <div className="absolute left-9 right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-sm text-zinc-400">
                        Estou pensando em{" "}
                        <strong className="ml-1 text-[#D91672] font-semibold">
                          {currentPlaceholder}
                        </strong>
                        <span className="animate-pulse font-light text-[#D91672] ml-px">|</span>
                      </div>
                    )}
                    <SearchAutocomplete
                      query={query}
                      hidden={hideAutocomplete}
                      onSelect={(val) => {
                        setHideAutocomplete(true);
                        navigate({
                          to: "/produtos",
                          search: (prev: Record<string, unknown>) => ({
                            ...prev,
                            busca: val || undefined,
                          }),
                        });
                        setQuery("");
                      }}
                    />
                  </div>
                </form>
              </div>
              <div className="flex-1 md:hidden" /> {/* Spacer for Mobile */}
              {/* Ícones de ação */}
              <div className="flex items-center gap-0.5 sm:gap-2 ml-auto">
                {/* Search Icon Mobile */}
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  aria-label="Buscar"
                  className="md:hidden flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100 cursor-pointer text-zinc-700 hover:text-black transition"
                >
                  <Search className="h-5 w-5" />
                </button>

                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full hover:bg-zinc-100 cursor-pointer text-zinc-700 hover:text-black transition"
                >
                  <Instagram className="h-[22px] w-[22px]" />
                </a>
                <a
                  href={whatsappLink(`Olá ${STORE_NAME}! Gostaria de mais informações.`)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full hover:bg-zinc-100 cursor-pointer text-zinc-700 hover:text-black transition"
                >
                  <WhatsAppIcon className="h-[22px] w-[22px]" />
                </a>
                <button
                  onClick={() => setOpen(true)}
                  aria-label="Sacola"
                  className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-700 hover:text-black cursor-pointer transition"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#D91672] px-1 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}

export { WHATSAPP_NUMBER };
