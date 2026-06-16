import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/bag-store";
import { formatPrice } from "@/data/products";

export function FloatingCartBar() {
  const { count, subtotal, setOpen } = useCart();
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-primary/95 px-4 py-2.5 backdrop-blur sm:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 text-primary-foreground"
      >
        <div className="flex items-center gap-2">
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary">
              {count}
            </span>
          </span>
          <span className="text-sm font-medium">
            {count} {count === 1 ? "item" : "itens"}
          </span>
        </div>
        <span className="font-display text-base font-semibold">{formatPrice(subtotal)}</span>
        <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium uppercase tracking-wider">
          Ver sacola
        </span>
      </button>
    </div>
  );
}
