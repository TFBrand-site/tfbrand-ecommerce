import { CATEGORIES } from "@/data/categories";
import { useSearch } from "@/lib/search-store";

const icons: Record<string, string> = {
  vestidos:
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=300&q=80",
  croppeds:
    "https://images.unsplash.com/photo-1485518882345-15568b007407?auto=format&fit=crop&w=300&q=80",
  conjuntos:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80",
  saias:
    "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=300&q=80",
  blusas:
    "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=300&q=80",
  calcas:
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=300&q=80",
  lancamentos:
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80",
};

export function CategoryShortcuts() {
  const { setCategory } = useSearch();
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
      <div className="flex gap-4 overflow-x-auto sm:justify-center sm:gap-8 py-4 px-2 -my-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => {
              setCategory(c.slug);
              document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group flex shrink-0 flex-col items-center gap-2 cursor-pointer"
          >
            <span className="relative p-[3px] rounded-full bg-linear-to-tr from-accent/60 to-gold/30 transition-all duration-555 group-hover:from-[#D91672] group-hover:to-[#D4AF37] shadow-sm group-hover:shadow-md group-hover:scale-105">
              <span className="block h-15 w-15 overflow-hidden rounded-full border-2 border-white bg-white sm:h-18 sm:w-18">
                <img
                  src={icons[c.slug]}
                  alt={c.label}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              </span>
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground sm:text-xs">
              {c.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
