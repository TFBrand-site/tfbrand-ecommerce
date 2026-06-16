import { CATEGORIES } from "@/data/categories";
import { useSearch } from "@/lib/search-store";
import { cn } from "@/lib/utils";

export function CategoryMenu() {
  const { category, setCategory } = useSearch();

  const select = (slug: string) => {
    setCategory(category === slug ? "" : slug);
  };

  return (
    <nav className="w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:justify-center scrollbar-none">
        <button
          onClick={() => setCategory("")}
          className={cn(
            "shrink-0 relative px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 cursor-pointer rounded-none",
            category === "" ? "text-[#D91672]" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Tudo
          {category === "" && (
            <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[#D91672]" />
          )}
        </button>

        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => select(c.slug)}
            className={cn(
              "shrink-0 relative px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 cursor-pointer",
              category === c.slug
                ? "text-[#D91672]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
            {category === c.slug && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[#D91672]" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
