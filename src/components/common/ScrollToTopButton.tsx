import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Mostrar após rolar 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className="fixed bottom-24 right-4 z-40 flex h-12 w-12 animate-in fade-in zoom-in items-center justify-center rounded-full bg-[#1e2329] text-white shadow-[0_4px_14px_0_rgba(0,0,0,0.25)] transition-all hover:bg-[#2b313a] active:scale-95 sm:bottom-24 cursor-pointer"
    >
      <ArrowUp className="h-6 w-6" />
    </button>
  );
}
