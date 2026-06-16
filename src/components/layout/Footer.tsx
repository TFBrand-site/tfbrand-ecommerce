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
    <footer className="bg-[#fafafa] border-t border-border/40 pb-24 pt-14 sm:pb-14">
      <div className="mx-auto max-w-7xl px-4">
        {/* Grid principal */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Coluna 1 — Marca */}
          <div className="lg:col-span-1">
            <a href="/" aria-label="TF Brand">
              <img src="/images/logo.png" alt="TF Brand" className="h-9 w-auto object-contain" />
            </a>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-[220px]">
              Boutique feminina online com peças selecionadas para a mulher contemporânea.
            </p>
            {/* Redes sociais */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:border-[#D91672]/40 hover:text-[#D91672] transition-all duration-200"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={whatsappLink(`Olá ${STORE_NAME}!`)}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:border-[#D91672]/40 hover:text-[#D91672] transition-all duration-200"
              >
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label="E-mail"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:border-[#D91672]/40 hover:text-[#D91672] transition-all duration-200"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Coluna 2 — Categorias */}
          <div>
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/60">
              Categorias
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/produtos"
                  className="text-sm text-muted-foreground hover:text-[#D91672] transition-colors block text-left"
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
                    className="text-sm text-muted-foreground hover:text-[#D91672] transition-colors block text-left"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3 — Contato */}
          <div>
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/60">
              Contato
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={whatsappLink(`Olá ${STORE_NAME}!`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#D91672] transition-colors cursor-pointer"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0" />
                  {formattedPhone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#D91672] transition-colors cursor-pointer"
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
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#D91672] transition-colors cursor-pointer"
                >
                  <Instagram className="h-4 w-4 shrink-0" />
                  @tfbrand___
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 4 — Informações */}
          <div>
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/60">
              Trocas & Devoluções
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Troca ou devolução garantida de qualquer peça em até 7 dias corridos após o
              recebimento, de forma simples e rápida.
            </p>
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/60">
              Pedidos
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Após finalizar o pedido, nossa equipe entrará em contato pelo WhatsApp para confirmar
              disponibilidade, pagamento e entrega.
            </p>
          </div>
        </div>

        {/* Rodapé copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/30 pt-6 sm:flex-row">
          <p className="text-[11px] text-muted-foreground/60">
            © {new Date().getFullYear()} {STORE_NAME}. Todos os direitos reservados.
          </p>
          <p className="text-[11px] text-muted-foreground/40">Boutique de Moda Feminina Premium</p>
        </div>
      </div>
    </footer>
  );
}
