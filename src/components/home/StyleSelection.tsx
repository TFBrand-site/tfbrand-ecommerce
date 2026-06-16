import { useSearch } from "@/lib/search-store";
import { SectionHeader } from "./SectionHeader";
import { ArrowUpRight } from "lucide-react";

const styles = [
  {
    name: "Look Casual",
    query: "casual",
    // Mulher em look casual chique, iluminação limpa
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Look Elegante",
    query: "elegante",
    // Mulher em vestido elegante, pose sofisticada
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Look Festa",
    query: "festa",
    // Editorial de moda festa — iluminação dramática
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Look Confortável",
    query: "confortável",
    // Look confortável mas fashion
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=85",
  },
];

export function StyleSelection() {
  const { setQuery } = useSearch();

  const handleSelectStyle = (q: string) => {
    setQuery(q);
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
      <SectionHeader
        eyebrow="Sua Identidade"
        title="Escolha por Estilo"
        subtitle="Encontre os looks que combinam com a sua personalidade."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
        {styles.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectStyle(s.query)}
            className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-muted cursor-pointer text-left w-full"
          >
            <img
              src={s.image}
              alt={s.name}
              className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            {/* Overlay degradê */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

            {/* Borda sutil de hover com cor da marca */}
            <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[#D91672]/60 transition-all duration-300" />

            {/* Texto */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-display text-sm font-bold text-white sm:text-base tracking-wide">
                {s.name}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white/50 group-hover:text-[#D91672] transition-colors duration-300">
                Ver coleção
                <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
