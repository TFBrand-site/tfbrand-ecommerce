import { STORE_NAME, whatsappLink } from "@/lib/config";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export function FloatingWhatsAppButton() {
  return (
    <a
      href={whatsappLink(`Olá ${STORE_NAME}! Gostaria de mais informações.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 sm:bottom-6"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}
