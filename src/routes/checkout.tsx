/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/bag-store";
import { formatPrice } from "@/data/products";
import { whatsappLink } from "@/lib/config";
import { toast } from "sonner";
import { createLead } from "@/lib/services/leads.service";
import { trackEvent } from "@/lib/analytics";
import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  CheckCircle2,
  User,
  Zap,
  CreditCard,
  Banknote,
  Store,
  Bike,
  Minus,
  Plus,
  Trash2,
  DollarSign,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [{ title: "Finalizar Pedido — TFBrand" }],
  }),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function phoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
      <span>⚠</span> {msg}
    </p>
  );
}

function RadioCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer ${
        selected
          ? "border-[#D91672] bg-[#D91672]/5 text-[#D91672] shadow-sm"
          : "border-zinc-200 text-zinc-500 hover:border-zinc-300 bg-white"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Sua sacola", shortLabel: "Sacola", icon: ShoppingBag },
  { id: 2, label: "Identificação", shortLabel: "Identificação", icon: User },
  { id: 3, label: "Pagamento e envio", shortLabel: "Pagamento", icon: DollarSign },
  { id: 4, label: "Confirmação", shortLabel: "Confirmação", icon: CheckCircle2 },
];

const PAYMENT_OPTIONS = [
  { value: "PIX", icon: Zap, label: "PIX" },
  { value: "Cartão (crédito ou débito)", icon: CreditCard, label: "Cartão (crédito ou débito)" },
  { value: "Espécie", icon: Banknote, label: "Espécie" },
];

const SHIPPING_OPTIONS = [
  { value: "Retirar em loja", icon: Store, label: "Retirar em loja" },
  { value: "Entrega", icon: Bike, label: "Entrega" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear, setOpen: setCartOpen, setQty, remove } = useCart();

  const [step, setStep] = useState(1);

  // Step 1
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  // Step 2
  const [pagamento, setPagamento] = useState("");
  const [envio, setEnvio] = useState("");

  // Step 3
  const [obs, setObs] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── API ViaCEP ───────────────────────────────────────────────────────────
  async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, "");
    if (v.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${v}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setRua(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setEstado(data.uf || "");
          setErrors((prev) => ({ ...prev, rua: "", bairro: "", cidade: "", estado: "" }));
        }
      } catch (err) {
        console.warn("Erro ao buscar CEP:", err);
      }
    }
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 2) {
      if (!nome.trim()) e.nome = "Informe seu nome completo";
      if (!telefone.trim() || telefone.replace(/\D/g, "").length < 10)
        e.telefone = "Digite um número de WhatsApp válido";
    }
    if (s === 3) {
      if (!pagamento) e.pagamento = "Escolha uma forma de pagamento";
      if (!envio) e.envio = "Escolha uma forma de envio";
      if (envio && envio !== "Retirar em loja") {
        if (!cep.trim()) e.cep = "Obrigatório";
        if (!rua.trim()) e.rua = "Obrigatório";
        if (!numero.trim()) e.numero = "Obrigatório";
        if (!bairro.trim()) e.bairro = "Obrigatório";
        if (!cidade.trim()) e.cidade = "Obrigatório";
        if (!estado.trim()) e.estado = "Obrigatório";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => s + 1);
  }

  function goBack() {
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => s - 1);
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  const submit = async () => {
    setIsSubmitting(true);
    // Abre a janela IMEDIATAMENTE antes de qualquer await para evitar bloqueador de popup do navegador
    const newWindow = window.open("about:blank", "_blank");

    try {
      const leadItems = items.map(({ product, qty, selectedSize, selectedColor }) => ({
        id: product.id,
        name: product.nome,
        sku: product.referencia,
        price: product.precoPromocional ?? product.preco,
        quantity: qty,
        size: selectedSize,
        color: selectedColor,
        image: (product as any).image_url || (product as any).imagem,
      }));

      // Tenta salvar no Supabase, mas NÃO cancela o WhatsApp se falhar
      try {
        await createLead({
          customer_name: nome,
          customer_phone: telefone,
          items: leadItems,
          subtotal,
          status: "iniciado",
          device_info: navigator.userAgent,
          origin: window.location.pathname,
        });

        trackEvent("whatsapp_checkout");
      } catch (supaErr) {
        console.warn("Falha ao salvar no banco de dados, prosseguindo com o WhatsApp...", supaErr);
      }

      const itemLines = items.map(({ product, qty, selectedSize, selectedColor }) => {
        const details = [
          selectedColor ? `Cor: ${selectedColor}` : null,
          selectedSize ? `Tam: ${selectedSize}` : null,
        ]
          .filter(Boolean)
          .join(" | ");
        const unitPrice = product.precoPromocional ?? product.preco;
        return `${qty}x ${product.nome}\n   ${details ? `(${details})\n   ` : ""}Valor: ${formatPrice(unitPrice * qty)}`;
      });

      const now = new Date();
      const dataHora =
        now.toLocaleDateString("pt-BR") +
        " às " +
        now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      const lines = [
        `================================`,
        `           TFBRAND`,
        `       RESUMO DO PEDIDO`,
        `================================`,
        ``,
        `[ DADOS DO CLIENTE ]`,
        `NOME: ${nome}`,
        `WHATSAPP: ${telefone}`,
        ``,
        `[ ITENS DO PEDIDO ]`,
        ...itemLines,
        ``,
        `[ PAGAMENTO E ENVIO ]`,
        `PAGAMENTO: ${pagamento}`,
        `ENVIO: ${envio}`,
        rua.trim() || bairro.trim()
          ? `ENDERECO: ${rua}, ${numero}${complemento ? ` - ${complemento}` : ""} - ${bairro}\nCEP: ${cep}\nCIDADE: ${cidade} - ${estado}`
          : null,
        obs.trim() ? `OBSERVACAO: ${obs}` : null,
        ``,
        `[ VALORES ]`,
        envio === "Entrega"
          ? `SUBTOTAL: ${formatPrice(subtotal)} + Entrega`
          : `SUBTOTAL: ${formatPrice(subtotal)}`,
        envio === "Entrega" ? null : `FRETE: ${envio === "Retirar em loja" ? "Grátis" : envio}`,
        `--------------------------------`,
        envio === "Entrega" ? null : `TOTAL: ${formatPrice(subtotal)}`,
        `================================`,
        `DATA: ${dataHora}`,
        `================================`,
        ``,
        `⚠️ ATENÇÃO: Seu pedido só será finalizado`,
        `após o ENVIO desta mensagem.`,
        `Aguardamos para dar continuidade! 💗`,
        `================================`,
      ]
        .filter((l) => l !== null)
        .join("\n");

      const link = whatsappLink(lines);

      if (newWindow) {
        newWindow.location.href = link;
      } else {
        window.location.href = link; // Fallback se o navegador bloquear o window.open
      }

      toast.success("Pedido enviado! Aguarde nosso contato pelo WhatsApp.");

      clear();
      setCartOpen(false);
      setIsSuccess(true);
    } catch (error: any) {
      if (newWindow) newWindow.close();
      toast.error(error?.message || "Erro ao gerar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-zinc-100 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Pedido gerado!</h1>
          <p className="text-zinc-600 mb-8">
            Uma nova aba foi aberta com o seu pedido no WhatsApp. Nossa equipe continuará o seu
            atendimento por lá!
          </p>
          <Link
            to="/"
            className="inline-flex h-12 px-6 items-center justify-center rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="bg-background border-b border-[#D91672]/10 sticky top-0 z-30">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Continuar comprando</span>
            <span className="sm:hidden">Voltar</span>
          </Link>

          <Link to="/">
            <img src="/images/logo.png" alt="TFBrand" className="h-8 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShoppingBag className="h-4 w-4" />
            <span>
              {items.length} {items.length === 1 ? "item" : "itens"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Step Indicator ──────────────────────────────────────────────────── */}
      <div className="bg-background border-b border-[#D91672]/10">
        <div className="py-4 sm:py-5">
          {/* ── Mobile Step Indicator ─────────────────────────────────────────── */}
          <div className="sm:hidden flex flex-col items-center justify-center px-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
              Etapa {step} de 4
            </span>
            <h2 className="text-base font-bold text-[#D91672]">{STEPS[step - 1].label}</h2>
            {/* Progress Bar */}
            <div className="w-full bg-[#D91672]/20 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#D91672] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* ── Desktop Step Indicator ────────────────────────────────────────── */}
          <div className="hidden sm:flex items-start justify-center gap-0">
            {STEPS.map((s, idx) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-center">
                  {/* Step circle + label */}
                  <div className="flex flex-col items-center gap-1.5 w-20">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        done
                          ? "bg-[#D91672] text-white"
                          : active
                            ? "bg-[#D91672] text-white ring-4 ring-[#D91672]/15"
                            : "bg-[#D91672]/15 text-[#D91672]/50"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
                    </div>
                    <span
                      className={`text-[11px] font-semibold whitespace-nowrap ${active ? "text-[#D91672]" : done ? "text-zinc-500" : "text-zinc-400"}`}
                    >
                      {s.shortLabel}
                    </span>
                  </div>
                  {/* Connector line */}
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-16 mb-4 rounded-full transition-all ${step > s.id ? "bg-[#D91672]" : "bg-[#D91672]/20"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-8">
        {items.length === 0 ? (
          /* ── Empty State ──────────────────────────────────────────────────────── */
          <div className="bg-white rounded-3xl p-10 md:p-16 text-center shadow-sm border border-zinc-100 flex flex-col items-center max-w-2xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-zinc-300" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              Sua sacola está vazia
            </h2>
            <p className="text-zinc-500 mb-8 max-w-md">
              Explore a coleção TFBrand e escolha suas peças favoritas. Você poderá revisar tudo
              antes de finalizar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                to="/produtos"
                className="h-12 px-8 rounded-xl bg-zinc-900 text-white font-bold text-sm flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                Ver produtos
              </Link>
              <Link
                to="/"
                className="h-12 px-8 rounded-xl bg-white text-zinc-900 font-bold text-sm flex items-center justify-center border-2 border-zinc-200 hover:border-zinc-900 transition-colors"
              >
                Ir para o Início
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start relative">
            {/* ── Form Column (left) ────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 w-full lg:max-w-[calc(100%-412px)]">
              <h1 className="text-2xl font-bold text-zinc-900 mb-6">{STEPS[step - 1].label}</h1>

              {/* ── STEP 1: Sua sacola ──────────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-sm text-zinc-500">
                    {items.length}{" "}
                    {items.length === 1 ? "item na sua sacola" : "itens na sua sacola"}
                  </p>

                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 divide-y divide-zinc-50">
                    {items.map(({ cartItemId, product, qty, selectedSize, selectedColor }) => (
                      <div
                        key={cartItemId}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-5"
                      >
                        {/* Imagem */}
                        <Link
                          to="/product/$id"
                          params={{ id: product.id }}
                          className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200 block group"
                        >
                          {(product as any).image_url || (product as any).imagem ? (
                            <img
                              src={(product as any).image_url || (product as any).imagem}
                              alt={product.nome}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-zinc-300" />
                            </div>
                          )}
                        </Link>

                        {/* Info Container */}
                        <div className="flex-1 min-w-0 w-full flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                          {/* Title and Attributes */}
                          <div className="flex-1 min-w-0">
                            <Link
                              to="/product/$id"
                              params={{ id: product.id }}
                              className="text-sm sm:text-base font-semibold text-zinc-900 line-clamp-2 leading-tight hover:underline"
                            >
                              {product.nome}
                            </Link>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedColor && (
                                <span className="text-[11px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                                  {selectedColor}
                                </span>
                              )}
                              {selectedSize && (
                                <span className="text-[11px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                                  Tam. {selectedSize}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price, Qty, Total */}
                          <div className="flex items-end sm:items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-8">
                            {/* Unit Price */}
                            <div className="hidden sm:block text-sm font-semibold text-zinc-900">
                              {product.precoPromocional &&
                              product.precoPromocional < product.preco ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-[#D91672]">
                                    {formatPrice(product.precoPromocional)}
                                  </span>
                                  <span className="text-xs text-zinc-400 line-through font-normal">
                                    {formatPrice(product.preco)}
                                  </span>
                                </div>
                              ) : (
                                formatPrice(product.preco)
                              )}
                            </div>

                            {/* Qty */}
                            <div className="flex items-center gap-1 bg-zinc-50 rounded-xl border border-zinc-200 overflow-hidden shrink-0">
                              <button
                                type="button"
                                onClick={() => setQty(cartItemId, Math.max(1, qty - 1))}
                                className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center text-[#D91672] hover:bg-zinc-100 transition-colors cursor-pointer"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold text-zinc-900">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQty(cartItemId, qty + 1)}
                                className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center text-[#D91672] hover:bg-zinc-100 transition-colors cursor-pointer"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Total Price & Delete container */}
                            <div className="flex flex-col items-end gap-1 shrink-0 min-w-[90px]">
                              <span className="text-base sm:text-lg font-bold text-zinc-900">
                                {formatPrice((product.precoPromocional ?? product.preco) * qty)}
                              </span>
                              <button
                                type="button"
                                onClick={() => remove(cartItemId)}
                                className="flex items-center justify-end gap-1.5 min-h-[44px] px-2 -mr-2 text-[11px] text-[#D91672] hover:text-[#c11363] hover:underline transition-colors mt-1 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>excluir da sacola</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal resumido */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 flex items-center justify-between">
                    <span className="text-sm text-zinc-500">
                      Subtotal ({items.length} {items.length === 1 ? "item" : "itens"})
                    </span>
                    <span className="text-lg font-bold text-zinc-900">{formatPrice(subtotal)}</span>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Identificação ──────────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Nome completo <span className="text-[#D91672]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Digite seu nome completo"
                        value={nome}
                        onChange={(e) => {
                          setNome(e.target.value);
                          setErrors((er) => ({ ...er, nome: "" }));
                        }}
                        className={`w-full h-12 px-4 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] ${errors.nome ? "border-red-400 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                      />
                      <FieldError msg={errors.nome} />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Celular / WhatsApp <span className="text-[#D91672]">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="(85) 99999-9999"
                        value={telefone}
                        onChange={(e) => {
                          setTelefone(phoneMask(e.target.value));
                          setErrors((er) => ({ ...er, telefone: "" }));
                        }}
                        className={`w-full h-12 px-4 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] ${errors.telefone ? "border-red-400 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                      />
                      <FieldError msg={errors.telefone} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Pagamento e envio ─────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                        Forma de pagamento <span className="text-[#D91672]">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_OPTIONS.map((opt) => (
                          <RadioCard
                            key={opt.value}
                            selected={pagamento === opt.value}
                            onClick={() => {
                              setPagamento(opt.value);
                              setErrors((er) => ({ ...er, pagamento: "" }));
                            }}
                          >
                            <opt.icon
                              className={`h-6 w-6 ${pagamento === opt.value ? "text-[#D91672]" : "text-zinc-400"}`}
                            />
                            <span>{opt.label}</span>
                          </RadioCard>
                        ))}
                      </div>
                      <FieldError msg={errors.pagamento} />
                    </div>

                    <div className="border-t border-zinc-100 pt-6">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                        Forma de envio <span className="text-[#D91672]">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {SHIPPING_OPTIONS.map((opt) => (
                          <RadioCard
                            key={opt.value}
                            selected={envio === opt.value}
                            onClick={() => {
                              setEnvio(opt.value);
                              setErrors((er) => ({ ...er, envio: "" }));
                            }}
                          >
                            <opt.icon
                              className={`h-6 w-6 ${envio === opt.value ? "text-[#D91672]" : "text-zinc-400"}`}
                            />
                            <span className="text-center leading-tight">{opt.label}</span>
                          </RadioCard>
                        ))}
                      </div>
                      <FieldError msg={errors.envio} />
                      {envio && envio !== "Retirar em loja" && (
                        <div className="space-y-4 pt-6 mt-6 border-t border-zinc-100 animate-in fade-in zoom-in-95 duration-300">
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                            Endereço de entrega <span className="text-[#D91672]">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                              <input
                                type="text"
                                placeholder="CEP *"
                                value={cep}
                                onBlur={handleCepBlur}
                                onChange={(e) => {
                                  const v = e.target.value
                                    .replace(/\D/g, "")
                                    .replace(/^(\d{5})(\d)/, "$1-$2")
                                    .substring(0, 9);
                                  setCep(v);
                                  setErrors((er) => ({ ...er, cep: "" }));
                                }}
                                className={`w-full h-12 px-4 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] ${errors.cep ? "border-red-400 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                              />
                              <FieldError msg={errors.cep} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 hidden sm:block" />
                            <div className="col-span-2 sm:col-span-1">
                              <input
                                type="text"
                                placeholder="Rua / Logradouro *"
                                value={rua}
                                onChange={(e) => {
                                  setRua(e.target.value);
                                  setErrors((er) => ({ ...er, rua: "" }));
                                }}
                                className={`w-full h-12 px-4 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] ${errors.rua ? "border-red-400 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                              />
                              <FieldError msg={errors.rua} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 flex gap-4">
                              <div className="w-1/3">
                                <input
                                  type="text"
                                  placeholder="Nº *"
                                  value={numero}
                                  onChange={(e) => {
                                    setNumero(e.target.value);
                                    setErrors((er) => ({ ...er, numero: "" }));
                                  }}
                                  className={`w-full h-12 px-4 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] ${errors.numero ? "border-red-400 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                                />
                                <FieldError msg={errors.numero} />
                              </div>
                              <div className="flex-1">
                                <input
                                  type="text"
                                  placeholder="Complemento"
                                  value={complemento}
                                  onChange={(e) => setComplemento(e.target.value)}
                                  className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
                                />
                              </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <input
                                type="text"
                                placeholder="Bairro *"
                                value={bairro}
                                onChange={(e) => {
                                  setBairro(e.target.value);
                                  setErrors((er) => ({ ...er, bairro: "" }));
                                }}
                                className={`w-full h-12 px-4 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] ${errors.bairro ? "border-red-400 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                              />
                              <FieldError msg={errors.bairro} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 flex gap-4">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  placeholder="Cidade *"
                                  value={cidade}
                                  onChange={(e) => {
                                    setCidade(e.target.value);
                                    setErrors((er) => ({ ...er, cidade: "" }));
                                  }}
                                  className={`w-full h-12 px-4 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] ${errors.cidade ? "border-red-400 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                                />
                                <FieldError msg={errors.cidade} />
                              </div>
                              <div className="w-1/3">
                                <input
                                  type="text"
                                  placeholder="UF *"
                                  value={estado}
                                  maxLength={2}
                                  onChange={(e) => {
                                    setEstado(e.target.value.toUpperCase());
                                    setErrors((er) => ({ ...er, estado: "" }));
                                  }}
                                  className={`w-full h-12 px-4 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] uppercase ${errors.estado ? "border-red-400 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                                />
                                <FieldError msg={errors.estado} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Confirmação ─────────────────────────────────────────── */}
              {step === 4 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Observação */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                      Alguma observação?{" "}
                      <span className="text-zinc-300 font-normal normal-case">(opcional)</span>
                    </label>
                    <textarea
                      placeholder="Ex: presente, horário preferido, etc."
                      value={obs}
                      onChange={(e) => setObs(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm resize-none outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
                    />
                  </div>

                  {/* Revisão dos dados */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Confirmação dos dados
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-xs text-[#D91672] hover:underline font-semibold"
                      >
                        Editar
                      </button>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-zinc-50">
                        <span className="text-zinc-400">Nome</span>
                        <span className="font-semibold text-zinc-800">{nome}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-zinc-50">
                        <span className="text-zinc-400">WhatsApp</span>
                        <span className="font-semibold text-zinc-800">{telefone}</span>
                      </div>
                      {(rua || bairro) && (
                        <div className="flex justify-between py-2 border-b border-zinc-50">
                          <span className="text-zinc-400">Localização</span>
                          <span className="font-semibold text-zinc-800 text-right max-w-[200px]">
                            {rua}, {numero}
                            {complemento ? ` - ${complemento}` : ""} - {bairro}
                            <br />
                            {cidade} - {estado} / CEP: {cep}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-zinc-50">
                        <span className="text-zinc-400">Pagamento</span>
                        <span className="font-semibold text-zinc-800">{pagamento}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-400">Envio</span>
                        <span className="font-semibold text-zinc-800">{envio}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-[#D91672]/30 bg-[#D91672]/5 p-5 flex gap-4 items-start shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-[#D91672] flex items-center justify-center shrink-0 shadow-md shadow-[#D91672]/30">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#D91672]">
                        Atenção antes de fechar esta tela!
                      </p>
                      <p className="text-sm text-zinc-700 leading-relaxed">
                        Clique em <strong className="text-zinc-900">"Enviar pelo WhatsApp"</strong>{" "}
                        logo abaixo e, quando o WhatsApp abrir,{" "}
                        <strong className="text-zinc-900">envie a mensagem</strong>. Só assim seu
                        pedido chegará para nós. Sem o envio, não recebemos nada. 💗
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Navigation buttons ───────────────────────────────────────── */}
              <div className="flex gap-3 mt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="h-13 px-6 rounded-xl border-2 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </button>
                ) : (
                  <Link
                    to="/produtos"
                    className="h-13 px-6 rounded-xl border-2 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Continuar comprando</span>
                    <span className="sm:hidden">Loja</span>
                  </Link>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex-1 h-13 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Continuar
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={isSubmitting}
                    className="flex-1 h-13 rounded-xl bg-[#D91672] hover:bg-[#c11363] text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#D91672]/25 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        Enviar pelo WhatsApp
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ── Coluna Direita (Resumo ou Benefícios) ─────────────────────────── */}
            <div className="w-full lg:w-[380px] shrink-0 sticky top-24 space-y-6">
              {step === 1 ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-3 border-b border-zinc-50">
                    Como funciona o seu pedido?
                  </h3>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D91672]/5 text-[#D91672] flex items-center justify-center shrink-0 font-bold text-xs">
                        1
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800">Preencha seus dados</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                          Insira suas informações de contato, entrega e pagamento aqui no checkout
                          de forma rápida.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D91672]/5 text-[#D91672] flex items-center justify-center shrink-0 font-bold text-xs">
                        2
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800">
                          Direcionamento ao WhatsApp
                        </h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                          Ao confirmar, você será direcionado para o nosso WhatsApp com a mensagem
                          do seu pedido já pronta.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D91672]/5 text-[#D91672] flex items-center justify-center shrink-0 font-bold text-xs">
                        3
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800">Atendimento e Entrega</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                          Nossa equipe finalizará os detalhes de pagamento e envio diretamente com
                          você de forma rápida.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-50 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                    <MessageCircle className="h-3.5 w-3.5 text-[#D91672]" />
                    <span>Seu pedido finalizado de forma rápida e segura.</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 animate-in fade-in slide-in-from-bottom-4 duration-400">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">
                    Resumo do Pedido
                  </h3>
                  <div className="divide-y divide-zinc-50 max-h-[300px] overflow-y-auto mb-4 pr-1 scrollbar-thin">
                    {items.map((item) => (
                      <div key={item.cartItemId} className="flex gap-3 py-3 first:pt-0">
                        <img
                          src={item.product.imagem}
                          alt={item.product.nome}
                          className="h-16 w-12 rounded-lg object-cover border border-zinc-150"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 truncate">
                            {item.product.nome}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-1">
                            {[item.selectedColor, item.selectedSize && `Tam. ${item.selectedSize}`]
                              .filter(Boolean)
                              .join(" · ")}
                            {" · "}
                            {item.qty}x
                          </p>
                        </div>
                        <span className="text-xs font-bold text-zinc-900 shrink-0">
                          {formatPrice(
                            (item.product.precoPromocional ?? item.product.preco) * item.qty,
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-700">Total</span>
                    <span className="text-lg font-bold text-[#D91672]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
