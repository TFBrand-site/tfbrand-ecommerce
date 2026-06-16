import { Link } from "@tanstack/react-router";
import { type Product, formatPrice } from "@/data/products";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const cat = product.categoria.replace("-", " ");
  const mainImage = product.imagem;
  const secondaryImage = product.variacoes?.[0]?.imagens?.[1] || null;

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group flex flex-col h-full overflow-hidden rounded-xl bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.06)] cursor-pointer text-current no-underline border border-transparent hover:border-black/[0.03]"
    >
      {/* Imagem */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl bg-[#F8F8F8] [transform:translateZ(0)]">
        <img
          src={mainImage}
          alt={product.nome}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-all duration-700 group-hover:scale-105",
            secondaryImage && "group-hover:opacity-0",
          )}
        />
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.nome} - Detalhe`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
          />
        )}

        {/* Badges Discretos */}
        <div className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-1 items-start">
          {product.destaque && (
            <span className="rounded-sm bg-white/80 backdrop-blur-sm px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#D91672] shadow-sm">
              Novidade
            </span>
          )}
          {product.maisVendido && (
            <span className="rounded-sm bg-white/80 backdrop-blur-sm px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-zinc-800 shadow-sm">
              Mais Vendido
            </span>
          )}
          {!product.destaque && !product.maisVendido && (
            <span className="rounded-sm bg-white/80 backdrop-blur-sm px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-zinc-600 shadow-sm">
              {cat}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Nome do Produto */}
        <h3 className="text-[13px] sm:text-sm font-bold leading-tight text-zinc-900 group-hover:text-[#D91672] transition-colors line-clamp-1 mb-1">
          {product.nome}
        </h3>

        {/* Preço */}
        <p className="font-display text-[15px] sm:text-base font-extrabold text-[#111] tracking-tight">
          {formatPrice(product.preco)}
        </p>

        {/* Quantidade de Cores */}
        <div className="flex items-center mt-2 min-h-[16px]">
          {product.variacoes && product.variacoes.length > 0 ? (
            <>
              <div className="flex -space-x-1 mr-1.5">
                {product.variacoes.slice(0, 3).map((v, i) => (
                  <div
                    key={v.slug}
                    className="w-3 h-3 rounded-full border border-white shadow-sm ring-1 ring-zinc-200"
                    style={{ backgroundColor: v.hex, zIndex: 10 - i }}
                    title={v.cor}
                  />
                ))}
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">
                {product.variacoes.length} {product.variacoes.length === 1 ? "cor" : "cores"}{" "}
                disponíveis
              </span>
            </>
          ) : (
            <>
              <div className="flex -space-x-1 mr-1.5">
                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm ring-1 ring-zinc-200"
                  style={{ backgroundColor: "#e4e4e7" }}
                  title="Cor única"
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">Cor única</span>
            </>
          )}
        </div>

        {/* Botão Selecionar */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-center w-full">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-[#D91672] transition-colors">
            Selecionar
          </span>
        </div>
      </div>
    </Link>
  );
}
