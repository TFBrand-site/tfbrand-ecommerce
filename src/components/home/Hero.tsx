import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/config";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

/* ── Slides – imagens editoriais de moda feminina premium ───────────────── */
const slides = [
  {
    // Mulher elegante em vestido longo – campanha de coleção
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=90",
    eyebrow: "Nova Coleção TFBrand",
    title: ["Elegância que", "fala por você"],
    subtitle: "Peças femininas para destacar sua beleza com estilo, sofisticação e atitude.",
    cta1: "Ver lançamentos",
    cta2: "Comprar pelo WhatsApp",
    accent: "#D91672",
    href: "/#lancamentos",
  },
  {
    // Look de moda editorial com pose sofisticada
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=90",
    eyebrow: "Curadoria Premium · TFBrand",
    title: ["Seu novo look", "começa aqui"],
    subtitle: "Looks selecionados para realçar seu estilo em todos os momentos com personalidade.",
    cta1: "Ver todos os produtos",
    cta2: "Comprar pelo WhatsApp",
    accent: "#D91672",
    href: "/produtos",
  },
  {
    // Editorial de moda feminina – iluminação profissional
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1800&q=90",
    eyebrow: "Tendências · Exclusivo",
    title: ["Moda feminina", "com atitude"],
    subtitle: "Moda moderna, sofisticada e pronta para acompanhar você em qualquer ocasião.",
    cta1: "Mais vendidos",
    cta2: "Comprar pelo WhatsApp",
    accent: "#D91672",
    href: "/#mais-vendidos",
  },
];

const INTERVAL = 6000;

export function Hero() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const [animating, setAnimating] = useState(false);
  const [progress, setProgress] = useState(0);

  const go = useCallback(
    (next: number) => {
      if (animating) return;
      setAnimating(true);
      setProgress(0);
      setCurrent(next);
      setTimeout(() => setAnimating(false), 800);
    },
    [animating],
  );

  const prev = () => go((current - 1 + slides.length) % slides.length);
  const next = () => go((current + 1) % slides.length);

  /* Autoplay com barra de progresso */
  useEffect(() => {
    setProgress(0);
    const step = 50;
    const inc = (step / INTERVAL) * 100;
    const progressTimer = setInterval(() => setProgress((p) => Math.min(p + inc, 100)), step);
    const slideTimer = setTimeout(() => go((current + 1) % slides.length), INTERVAL);
    return () => {
      clearInterval(progressTimer);
      clearTimeout(slideTimer);
    };
  }, [current, go]);

  const s = slides[current];

  return (
    <section
      className="relative w-full overflow-hidden bg-[#111]"
      style={{ height: "clamp(540px, 85vh, 720px)" }}
      aria-label="Banner principal TFBrand"
    >
      {/* ── Camadas de imagem com cross-fade ─────────────────────────────── */}
      {slides.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== current}
          className={`absolute inset-0 transition-opacity duration-900 ease-in-out ${
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <img
            src={slide.image}
            alt=""
            className={`h-full w-full object-cover object-center transition-transform duration-6000 ease-out ${
              i === current ? "scale-105" : "scale-100"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
          />
        </div>
      ))}

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      {/* Gradiente lateral esquerdo – área de texto */}
      <div className="absolute inset-0 z-20 bg-linear-to-r from-black/80 via-black/50 to-black/5" />
      {/* Gradiente inferior – profundidade */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-48 bg-linear-to-t from-black/60 to-transparent" />
      {/* Vinheta superior suave */}
      <div className="absolute inset-x-0 top-0 z-20 h-32 bg-linear-to-b from-black/30 to-transparent" />
      {/* Grain texture para toque luxuoso */}
      <div
        className="absolute inset-0 z-20 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundSize: "180px 180px",
        }}
      />

      {/* ── Conteúdo principal ────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-30 flex flex-col">
        {/* Área de conteúdo central */}
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
            {/* Texto animado por slide */}
            <div
              key={current}
              style={{ animation: "heroFadeIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}
            >
              {/* Eyebrow – tag de coleção */}
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-8 rounded-full" style={{ background: s.accent }} />
                <span
                  className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em]"
                  style={{ color: s.accent }}
                >
                  {s.eyebrow}
                </span>
              </div>

              {/* Título principal – duas linhas */}
              <h1
                className="font-display font-extrabold leading-none tracking-tight text-white"
                style={{ fontSize: "clamp(2.2rem, 8vw, 5rem)" }}
              >
                {s.title[0]}
                <br />
                <span className="italic font-light">{s.title[1]}</span>
              </h1>

              {/* Separador decorativo */}
              <div className="flex items-center gap-4 my-5">
                <div className="h-px w-12 bg-white/20" />
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: s.accent }} />
                <div className="h-px w-6 bg-white/20" />
              </div>

              {/* Subtítulo */}
              <p className="max-w-[38ch] text-sm sm:text-base leading-relaxed text-white/70 font-light">
                {s.subtitle}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href={s.href}
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white transition-all duration-300 hover:brightness-90 hover:-translate-y-0.5 active:translate-y-0 shadow-lg cursor-pointer"
                  style={{ background: s.accent }}
                >
                  {s.cta1}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>

                <Button
                  variant="outline"
                  className="rounded-full w-full sm:w-auto border-white/30 bg-white/5 text-white hover:bg-white hover:text-[#111] hover:border-white backdrop-blur-md text-sm px-7 py-3 h-auto font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)] cursor-pointer"
                  onClick={() =>
                    window.open(
                      whatsappLink(`Olá TFBrand! Quero conhecer as novidades da nova coleção.`),
                      "_blank",
                    )
                  }
                >
                  {s.cta2}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Barra inferior – navegação e progresso ───────────────────── */}
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pb-6 sm:pb-8">
          <div className="flex items-end justify-between gap-6">
            {/* Contador + barra de progresso */}
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white tabular-nums leading-none">
                  {String(current + 1).padStart(2, "0")}
                </span>
                <span className="text-white/30 text-sm font-light">
                  / {String(slides.length).padStart(2, "0")}
                </span>
              </div>
              {/* Barra de progresso animada */}
              <div className="h-px w-24 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-none"
                  style={{
                    width: `${progress}%`,
                    background: s.accent,
                    transition: progress === 0 ? "none" : "width 0.05s linear",
                  }}
                />
              </div>
            </div>

            {/* Dots + setas */}
            <div className="flex items-center gap-4">
              {/* Dots */}
              <div className="hidden sm:flex items-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    aria-label={`Slide ${i + 1}`}
                    className="cursor-pointer transition-all duration-300"
                    style={{
                      width: i === current ? "28px" : "8px",
                      height: "3px",
                      borderRadius: "9999px",
                      background: i === current ? s.accent : "rgba(255,255,255,0.3)",
                    }}
                  />
                ))}
              </div>

              {/* Setas */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  aria-label="Slide anterior"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 hover:border-white/50 hover:text-white bg-white/5 backdrop-blur-sm transition-all cursor-pointer hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={next}
                  aria-label="Próximo slide"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 hover:border-white/50 hover:text-white bg-white/5 backdrop-blur-sm transition-all cursor-pointer hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
