import { Instagram, Mail } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  CONTACT_EMAIL,
  INSTAGRAM_URL,
  STORE_NAME,
  WHATSAPP_NUMBER,
  whatsappLink,
} from "@/lib/config";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { CATEGORIES } from "@/data/categories";

export function Footer() {
  const formattedPhone = WHATSAPP_NUMBER.replace(
    /^(\d{2})(\d{2})(\d{5})(\d{4})$/,
    "+$1 ($2) $3-$4",
  );

  return (
    <footer
      className="pb-16 pt-10 sm:pb-10 border-t-0"
      style={{ background: "linear-gradient(135deg, #1a0010 0%, #2d0018 50%, #1a000d 100%)" }}
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-16 xl:px-24">
        {/* Grid principal */}
        <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
          {/* Coluna 1 — Marca */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-4">
            <div>
              <a href="/" aria-label="TF Brand" className="inline-block">
                <img
                  src="/images/logo.png"
                  alt="TF Brand"
                  className="h-9 w-auto object-contain brightness-0 invert"
                />
              </a>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/70 max-w-[220px]">
                Entregamos para todo Brasil
              </p>
            </div>
          </div>

          {/* Coluna 2 — Categorias */}
          <div className="col-span-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 mb-3 sm:mb-4">
              Categorias
            </h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link
                  to="/produtos"
                  className="text-xs sm:text-sm text-white/70 hover:text-[#D91672] transition-colors py-1 block text-left"
                >
                  Todos
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    to="/produtos"
                    search={
                      c.slug === "lancamentos" ? { filtro: "lancamentos" } : { categoria: c.slug }
                    }
                    className="text-xs sm:text-sm text-white/70 hover:text-[#D91672] transition-colors py-1 block text-left"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3 — Contato & Pedidos */}
          <div className="col-span-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 mb-3 sm:mb-4">
              Contato & Pedidos
            </h3>
            <div className="space-y-4">
              <ul className="space-y-1 sm:space-y-2">
                <li>
                  <a
                    href={whatsappLink(`Olá ${STORE_NAME}!`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 py-1 text-xs sm:text-sm text-white/70 hover:text-[#D91672] transition-colors cursor-pointer"
                  >
                    <WhatsAppIcon className="h-4 w-4 shrink-0" />
                    {formattedPhone}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="inline-flex items-center gap-2 py-1 text-xs sm:text-sm text-white/70 hover:text-[#D91672] transition-colors cursor-pointer"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    {CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 py-1 text-xs sm:text-sm text-white/70 hover:text-[#D91672] transition-colors cursor-pointer"
                  >
                    <Instagram className="h-4 w-4 shrink-0" />
                    @tfbrand___
                  </a>
                </li>
              </ul>

              <div className="hidden sm:block">
                <p className="text-xs sm:text-sm leading-relaxed text-white/70">
                  Finalize o pedido com a nossa equipe pelo WhatsApp para confirmar disponibilidade,
                  pagamento e entrega.
                </p>
              </div>
            </div>
          </div>

          {/* Coluna 4 — Política de Trocas */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 mb-3 sm:mb-4">
              Política de Trocas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div>
                <strong className="text-white block text-[11px] sm:text-xs mb-0.5">
                  1. PRAZO PARA TROCA
                </strong>
                <p className="text-[11px] sm:text-xs leading-relaxed text-white/60">
                  Em até 5 dias, exclusivamente para compras online e presentes.
                </p>
              </div>
              <div>
                <strong className="text-white block text-[11px] sm:text-xs mb-0.5">
                  2. COMPROU NA LOJA?
                </strong>
                <p className="text-[11px] sm:text-xs leading-relaxed text-white/60">
                  Peça experimentada em loja não tem troca.
                </p>
              </div>
              <div>
                <strong className="text-white block text-[11px] sm:text-xs mb-0.5">
                  3. CONDIÇÕES DAS PEÇAS
                </strong>
                <p className="text-[11px] sm:text-xs leading-relaxed text-white/60">
                  Sem uso, e não trocamos roupas brancas, paetê ou tule.
                </p>
              </div>
              <div>
                <strong className="text-white block text-[11px] sm:text-xs mb-0.5">
                  4. ITENS PROMOCIONAIS
                </strong>
                <p className="text-[11px] sm:text-xs leading-relaxed text-white/60">
                  Não trocamos peças de promoção.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] sm:text-xs font-semibold text-[#D91672] italic">
              ♥ Agradecemos a compreensão!
            </p>
          </div>
        </div>

        {/* Info de Pedidos para Mobile */}
        <div className="mt-6 pt-4 border-t border-white/5 sm:hidden">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80 mb-1">
            Pedidos
          </h4>
          <p className="text-xs leading-relaxed text-white/60">
            Finalize o pedido com a nossa equipe pelo WhatsApp para confirmar disponibilidade,
            pagamento e entrega.
          </p>
        </div>

        {/* Rodapé copyright */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row">
          <p className="text-[11px] text-white/40 text-center sm:text-left">
            © {new Date().getFullYear()} {STORE_NAME}. Todos os direitos reservados.
          </p>
          <Link
            to="/admin"
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            Acesso Restrito
          </Link>
        </div>
      </div>
    </footer>
  );
}
