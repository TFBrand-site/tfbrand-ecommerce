import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/bag-store";
import { formatPrice } from "@/data/products";
import { Link } from "@tanstack/react-router";

export function CartDrawer() {
  const { items, subtotal, open, setOpen, setQty, remove } = useCart();

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="font-display text-xl">Sua sacola</SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Sua sacola está vazia. Adicione peças para finalizar pelo WhatsApp.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <ul className="space-y-4">
                  {items.map(({ cartItemId, product, qty, selectedSize, selectedColor }) => (
                    <li key={cartItemId} className="flex gap-3">
                      <img
                        src={product.imagem}
                        alt={product.nome}
                        className="h-24 w-20 shrink-0 rounded-md object-cover"
                        loading="lazy"
                      />
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold leading-tight line-clamp-1">
                              {product.nome}
                            </h3>
                            <div className="mt-1 flex flex-col gap-0.5">
                              {selectedColor && (
                                <p className="text-[11px] text-muted-foreground">
                                  Cor: <span className="font-medium">{selectedColor}</span>
                                </p>
                              )}
                              {selectedSize && (
                                <p className="text-[11px] text-muted-foreground">
                                  Tamanho: <span className="font-medium">{selectedSize}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => remove(cartItemId)}
                            aria-label="Remover"
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center rounded-full border border-zinc-200">
                            <button
                              onClick={() => setQty(cartItemId, qty - 1)}
                              className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-l-full hover:bg-zinc-100 disabled:opacity-40 transition-colors cursor-pointer"
                              disabled={qty <= 1}
                              aria-label="Diminuir"
                            >
                              <Minus className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-zinc-700" />
                            </button>
                            <span className="min-w-8 text-center text-[13px] sm:text-sm font-medium">
                              {qty}
                            </span>
                            <button
                              onClick={() => {
                                const variation = product.variacoes?.find((v) => v.cor === selectedColor);
                                const maxStock = selectedSize && variation?.estoquePorTamanho
                                  ? variation.estoquePorTamanho[selectedSize] ?? 999
                                  : 999;
                                if (qty < maxStock) {
                                  setQty(cartItemId, qty + 1);
                                }
                              }}
                              className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-r-full hover:bg-zinc-100 disabled:opacity-40 transition-colors cursor-pointer"
                              disabled={(() => {
                                const variation = product.variacoes?.find((v) => v.cor === selectedColor);
                                const maxStock = selectedSize && variation?.estoquePorTamanho
                                  ? variation.estoquePorTamanho[selectedSize] ?? 999
                                  : 999;
                                return qty >= maxStock;
                              })()}
                              aria-label="Aumentar"
                            >
                              <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-zinc-700" />
                            </button>
                          </div>
                          <span className="font-display text-base font-semibold">
                            {formatPrice((product.precoPromocional ?? product.preco) * qty)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-border bg-card px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-display text-xl font-semibold">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <Button
                  asChild
                  className="w-full rounded-full bg-[#D91672] hover:bg-[#c11363] text-white py-6 text-sm font-semibold tracking-wider uppercase cursor-pointer transition shadow-md"
                  size="lg"
                >
                  <Link to="/checkout" onClick={() => setOpen(false)}>
                    Finalizar pelo WhatsApp
                  </Link>
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Pagamento e entrega confirmados via WhatsApp.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
