import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { type Product } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "./SectionHeader";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BestSellers({ products }: { products: Product[] }) {
  const items = useMemo(() => products.filter((p) => p.maisVendido).slice(0, 8), [products]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 10);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 15);
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        const pct = scrollLeft / maxScroll;
        setActiveIndex(
          Math.min(items.length - 1, Math.max(0, Math.round(pct * (items.length - 1)))),
        );
      } else {
        setActiveIndex(0);
      }
    }
  }, [items.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      checkScroll();
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  useEffect(() => {
    if (isPaused || items.length === 0) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft >= scrollWidth - clientWidth - 20) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          const card = scrollRef.current.children[0] as HTMLElement;
          const gap = parseFloat(window.getComputedStyle(scrollRef.current).columnGap) || 20;
          scrollRef.current.scrollBy({ left: card.offsetWidth + gap, behavior: "smooth" });
        }
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, items, interactionCount]);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const card = scrollRef.current.children[0] as HTMLElement;
      const gap = parseFloat(window.getComputedStyle(scrollRef.current).columnGap) || 20;
      const amount = (dir === "left" ? -1 : 1) * (card.offsetWidth + gap);
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
      setInteractionCount((prev) => prev + 1);
    }
  };

  const scrollToCard = (index: number) => {
    if (scrollRef.current && scrollRef.current.children.length > index) {
      const container = scrollRef.current;
      const card = container.children[index] as HTMLElement;
      container.scrollTo({ left: card.offsetLeft - container.offsetLeft, behavior: "smooth" });
      setInteractionCount((prev) => prev + 1);
    }
  };

  return (
    <section
      id="mais-vendidos"
      className="mx-auto max-w-7xl px-4 py-8 sm:py-14"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <SectionHeader
        eyebrow="Favoritas"
        title="Mais Vendidos"
        subtitle="As queridinhas das nossas clientes"
      />

      <div className="relative mt-6 sm:mt-10">
        <button
          onClick={() => scroll("left")}
          disabled={!showLeft}
          aria-label="Anterior"
          className="absolute left-2 md:-left-6 lg:-left-10 xl:-left-14 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-border bg-white shadow-md text-foreground transition-all hover:border-[#D91672]/50 hover:text-[#D91672] hover:shadow-lg disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          onClick={() => scroll("right")}
          disabled={!showRight}
          aria-label="Próximo"
          className="absolute right-2 md:-right-6 lg:-right-10 xl:-right-14 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-border bg-white shadow-md text-foreground transition-all hover:border-[#D91672]/50 hover:text-[#D91672] hover:shadow-lg disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <div className="overflow-hidden">
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((p) => (
              <div
                key={p.id}
                className="w-[calc(50%-8px)] shrink-0 snap-start sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center w-full">
        <Link
          to="/produtos"
          className="inline-flex items-center justify-center rounded-full bg-[#111] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#D91672] transition-colors shadow-sm"
        >
          Ver todos os produtos
        </Link>
      </div>
    </section>
  );
}
