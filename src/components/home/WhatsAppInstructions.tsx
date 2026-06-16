import { Instagram } from "lucide-react";
import { INSTAGRAM_URL } from "@/lib/config";

export function WhatsAppInstructions() {
  return (
    <section
      id="instagram-promo"
      className="py-16 sm:py-20 bg-[#FFF1F7] border-t border-zinc-100 flex flex-col items-center justify-center text-center px-4"
    >
      <div className="flex flex-col items-center gap-1 mb-4">
        <div className="flex items-center gap-2 text-[#111]">
          <Instagram className="w-8 h-8 sm:w-10 sm:h-10" />
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
            tfbrand___
          </h2>
        </div>
      </div>

      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 mb-10 px-8 py-2.5 rounded-full border border-[#111] text-[#111] text-xs font-bold uppercase tracking-widest hover:bg-[#111] hover:text-white transition-colors duration-300"
      >
        Siga-nos
      </a>
    </section>
  );
}
