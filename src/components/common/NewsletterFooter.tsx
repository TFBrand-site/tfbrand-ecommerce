import { useState } from "react";
import { toast } from "sonner";
import { CONTACT_EMAIL } from "@/lib/config";

const FORMSPREE_URL = "https://formspree.io/f/maqzbnzq";

export function NewsletterFooter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section
      className="relative overflow-hidden py-14 sm:py-20"
      style={{ background: "linear-gradient(135deg, #1a0010 0%, #2d0018 50%, #1a000d 100%)" }}
    >
      {/* Glow decorativo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[#D91672]/15 blur-[80px] pointer-events-none" />

      <div className="relative mx-auto max-w-lg px-4 text-center">
        {/* Eyebrow */}
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D91672]">
          PARTICIPE DAS NOSSAS LIVES PROMOCIONAIS
        </span>

        <h2 className="font-display mt-3 text-3xl font-extrabold text-white sm:text-4xl">
          Ei, diva <span className="text-[#D91672]">♥</span>
        </h2>

        <p className="mx-auto mt-3 max-w-sm text-sm text-white/55 leading-relaxed">
          RECEBA AVISOS PRÉVIOS DAS LIVES
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!email) return;

            setIsSubmitting(true);
            try {
              const response = await fetch(FORMSPREE_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({ email }),
              });

              if (response.ok) {
                toast.success("Inscrita com sucesso! Fique de olho no seu e-mail.");
                setEmail("");
              } else {
                toast.error("Poxa, deu um erro ao inscrever. Tente novamente.");
              }
            } catch (error) {
              toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="mx-auto mt-7 flex max-w-md gap-2"
        >
          <input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="h-11 flex-1 rounded-full border border-white/10 bg-white/8 px-5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#D91672]/50 focus:bg-white/12 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 rounded-full bg-[#D91672] px-6 text-sm font-semibold text-white hover:bg-[#c11363] transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? "Enviando..." : "Inscrever"}
          </button>
        </form>

        <p className="mt-4 text-[10px] text-white/25">
          Sem spam. Quer cancelar sua inscrição?{" "}
          <button
            onClick={() => {
              // Tenta abrir o cliente de email
              window.location.href = `mailto:${CONTACT_EMAIL}?subject=Cancelar%20Inscri%C3%A7%C3%A3o%20-%20Newsletter&body=Ol%C3%A1%2C%20gostaria%20de%20cancelar%20a%20inscri%C3%A7%C3%A3o%20do%20meu%20e-mail%20da%20newsletter%20da%20TFBrand.`;
              // Copia para área de transferência como fallback
              navigator.clipboard.writeText(CONTACT_EMAIL).then(() => {
                toast.success(
                  "E-mail de cancelamento copiado! Se seu app de e-mail não abriu, envie para " +
                    CONTACT_EMAIL,
                );
              });
            }}
            className="underline hover:text-[#D91672] transition-colors cursor-pointer bg-transparent border-none p-0 inline font-inherit text-inherit"
          >
            Clique aqui
          </button>
          .
        </p>
      </div>
    </section>
  );
}
