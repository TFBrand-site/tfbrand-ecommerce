import { MessageCircle, CreditCard, Sparkles, CheckCircle } from "lucide-react";

export function BenefitsBar() {
  const benefits = [
    {
      icon: MessageCircle,
      title: "Atendimento Rápido",
      desc: "Suporte humanizado via WhatsApp",
    },
    {
      icon: CreditCard,
      title: "Pedido Simplificado",
      desc: "Finalize direto pelo chat",
    },
    {
      icon: Sparkles,
      title: "Novidades Semanais",
      desc: "Peças novas toda semana",
    },
    {
      icon: CheckCircle,
      title: "Curadoria Premium",
      desc: "Peças exclusivas selecionadas",
    },
  ];

  return (
    <div className="w-full bg-[#FFF1F7]/60 border-y border-border/40 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center p-3 rounded-2xl hover:bg-white/40 transition duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#D91672] shadow-sm mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground sm:text-sm">
                  {b.title}
                </h4>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
