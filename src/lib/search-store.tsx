import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";

type SearchCtx = {
  query: string;
  setQuery: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
};

const Ctx = createContext<SearchCtx | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQueryState] = useState("");
  const [category, setCategoryState] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Sync initial state from URL
  useEffect(() => {
    const searchParams = location.search as Record<string, string | undefined>;
    setCategoryState(searchParams?.categoria || "");
  }, [location.search]);

  const setQuery = (v: string) => {
    setQueryState(v);
  };

  const setCategory = (v: string) => {
    setCategoryState(v);
    if (location.pathname !== "/produtos") {
      navigate({
        to: "/produtos",
        search: { categoria: v || undefined },
      });
    } else {
      navigate({
        to: "/produtos",
        search: (prev: Record<string, unknown>) => ({ ...prev, categoria: v || undefined }),
      });
    }
  };

  return <Ctx.Provider value={{ query, setQuery, category, setCategory }}>{children}</Ctx.Provider>;
}

export function useSearch() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSearch fora do SearchProvider");
  return v;
}
