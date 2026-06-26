import { type Product } from "@/data/products";
import { Link } from "@tanstack/react-router";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeader } from "./SectionHeader";

export function Lancamentos({ products }: { products: Product[] }) {
  const items = products.filter((p) => p.destaque).slice(0, 8);
  return (
    <section
      id="lancamentos"
      className="mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-16 xl:px-24 py-8 sm:py-14 flex flex-col items-center"
    >
      <div className="w-full">
        <SectionHeader
          eyebrow="Recém chegadas"
          title="Lançamentos"
          subtitle="Peças novas que acabaram de chegar na loja"
        />
        <ProductGrid products={items} />
      </div>
    </section>
  );
}
