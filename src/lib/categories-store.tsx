import React, { createContext, useContext, useEffect, useState } from "react";
import { getCategories } from "@/lib/services/categories.service";

export type CategoryUI = {
  slug: string;
  label: string;
};

const CategoriesContext = createContext<CategoryUI[]>([]);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<CategoryUI[]>([]);

  useEffect(() => {
    // Busca apenas as categorias ativas
    getCategories(true)
      .then((data) => {
        setCategories(
          data.map((c) => ({
            slug: c.slug,
            label: c.name,
          }))
        );
      })
      .catch((error) => {
        console.error("Erro ao carregar categorias dinâmicas:", error);
      });
  }, []);

  return (
    <CategoriesContext.Provider value={categories}>
      {children}
    </CategoriesContext.Provider>
  );
}

export const useCategories = () => useContext(CategoriesContext);
