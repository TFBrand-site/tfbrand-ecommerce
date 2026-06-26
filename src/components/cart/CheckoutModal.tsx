/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/lib/bag-store";
import { formatPrice } from "@/data/products";
import { whatsappLink } from "@/lib/config";
import { toast } from "sonner";
import { createLead } from "@/lib/services/leads.service";
import { trackEvent } from "@/lib/analytics";
import {
  ShoppingBag,
  X,
  MessageCircle,
  Package,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User,
  Truck,
  FileText,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function phoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ─── Tiny Components ─────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
      <span>⚠</span> {msg}
    </p>
  );
}

function InputField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
        {label}
        {required && <span className="text-[#D91672] ml-0.5">*</span>}
        {!required && <span className="text-zinc-400 font-normal ml-1">(opcional)</span>}
      </label>
      {children}
      <FieldError msg={error} />
    </div>
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
      className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer ${
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
  { id: 1, label: "Seus dados", icon: User },
  { id: 2, label: "Entrega", icon: Truck },
  { id: 3, label: "Revisão", icon: FileText },
];

const PAYMENT_OPTIONS = [
  { value: "PIX", emoji: "⚡", label: "PIX" },
  { value: "Cartão (crédito ou débito)", emoji: "💳", label: "Cartão (crédito ou débito)" },
  { value: "Espécie", emoji: "💵", label: "Espécie" },
];

const SHIPPING_OPTIONS = [
  { value: "Retirar em loja", emoji: "🏪", label: "Retirar em loja" },
  { value: "Entrega", emoji: "🛵", label: "Entrega" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, clear, setOpen: setCartOpen } = useCart();

  const [step, setStep] = useState(1);

  // Step 1 fields
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [local, setLocal] = useState("");
  const [bairro, setBairro] = useState("");

  // Step 2 fields
  const [pagamento, setPagamento] = useState("");
  const [envio, setEnvio] = useState("");

  // Step 3 fields
  const [obs, setObs] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // ─── Validation ───────────────────────────────────────────────────────────

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!nome.trim()) e.nome = "Informe seu nome completo";
      if (!telefone.trim() || telefone.replace(/\D/g, "").length < 10)
        e.telefone = "Digite um número de WhatsApp válido";
    }
    if (s === 2) {
      if (!pagamento) e.pagamento = "Escolha uma forma de pagamento";
      if (!envio) e.envio = "Escolha uma forma de envio";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => s + 1);
  }

  function goBack() {
    setErrors({});
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => s - 1);
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const leadItems = items.map(({ product, qty, selectedSize, selectedColor }) => ({
        id: product.id,
        name: product.nome,
        sku: product.referencia,
        price: product.preco,
        quantity: qty,
        size: selectedSize,
        color: selectedColor,
        image: (product as any).image_url || (product as any).imagem,
      }));

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

      const itemLines = items.map(({ product, qty, selectedSize, selectedColor }) => {
        const parts = [product.nome];
        if (selectedColor) parts.push(`Cor: ${selectedColor}`);
        if (selectedSize) parts.push(`Tam: ${selectedSize}`);
        const unitPrice = product.precoPromocional ?? product.preco;
        parts.push(`${qty}x ${formatPrice(unitPrice)} = ${formatPrice(unitPrice * qty)}`);
        return `  • ${parts.join(" — ")}`;
      });

      const lines = [
        `🛍️ *TFBrand — Novo Pedido*`,
        ``,
        `👤 *Dados do cliente*`,
        `Nome: ${nome}`,
        `WhatsApp: ${telefone}`,
        local.trim() ? `Local: ${local}` : null,
        bairro.trim() ? `Bairro: ${bairro}` : null,
        ``,
        `💳 *Pagamento & Envio*`,
        `Pagamento: ${pagamento}`,
        `Envio: ${envio}`,
        obs.trim() ? `\n📝 *Observação*\n${obs}` : null,
        ``,
        `🧺 *Itens do pedido*`,
        ...itemLines,
        ``,
        envio === "Entrega"
          ? `💰 *Subtotal: ${formatPrice(subtotal)} + Entrega*`
          : `💰 *Total: ${formatPrice(subtotal)}*`,
        ``,
        `_Pedido gerado pelo site TFBrand_`,
      ]
        .filter((l) => l !== null)
        .join("\n");

      window.open(whatsappLink(lines), "_blank");
      toast.success("Pedido enviado! Aguarde nosso contato pelo WhatsApp.");

      clear();
      onClose();
      setCartOpen(false);
      setStep(1);
      setNome("");
      setTelefone("");
      setLocal("");
      setBairro("");
      setObs("");
      setPagamento("");
      setEnvio("");
      setErrors({});
    } catch (error: any) {
      toast.error(error?.message || "Erro ao gerar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-200 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-white px-6 pt-5 pb-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D91672]/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-4 w-4 text-[#D91672]" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Finalizar pedido</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, idx) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        done
                          ? "bg-[#D91672] text-white"
                          : active
                            ? "bg-[#D91672] text-white ring-4 ring-[#D91672]/20"
                            : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                    </div>
                    <span
                      className={`text-[10px] font-medium whitespace-nowrap ${
                        active ? "text-[#D91672]" : done ? "text-zinc-600" : "text-zinc-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 mb-4 rounded-full transition-all ${
                        step > s.id ? "bg-[#D91672]" : "bg-zinc-100"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable Content ───────────────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-zinc-50/60">
          <div className="px-5 pt-5 pb-3 space-y-4">
            {/* ── STEP 1: Seus dados ──────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#D91672]">
                    Seus dados
                  </p>

                  <InputField label="Nome completo" required error={errors.nome}>
                    <input
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={nome}
                      onChange={(e) => {
                        setNome(e.target.value);
                        setErrors((er) => ({ ...er, nome: "" }));
                      }}
                      className={`w-full h-11 px-4 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] ${errors.nome ? "border-red-400 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                    />
                  </InputField>

                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Celular / WhatsApp" required error={errors.telefone}>
                      <input
                        type="tel"
                        placeholder="(85) 99999-9999"
                        value={telefone}
                        onChange={(e) => {
                          setTelefone(phoneMask(e.target.value));
                          setErrors((er) => ({ ...er, telefone: "" }));
                        }}
                        className={`w-full h-11 px-4 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] ${errors.telefone ? "border-red-400 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
                      />
                    </InputField>

                    <InputField label="Cidade / Estado">
                      <input
                        type="text"
                        placeholder="Ex: Fortaleza - CE"
                        value={local}
                        onChange={(e) => setLocal(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
                      />
                    </InputField>
                  </div>

                  <InputField label="Bairro">
                    <input
                      type="text"
                      placeholder="Ex: Meireles, Aldeota..."
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
                    />
                  </InputField>
                </div>
              </div>
            )}

            {/* ── STEP 2: Entrega e Pagamento ─────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#D91672]">
                    Entrega e pagamento
                  </p>

                  {/* Pagamento */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-2">
                      Forma de pagamento <span className="text-[#D91672]">*</span>
                    </label>
                    <div className="grid gap-2">
                      {PAYMENT_OPTIONS.map((opt) => (
                        <RadioCard
                          key={opt.value}
                          selected={pagamento === opt.value}
                          onClick={() => {
                            setPagamento(opt.value);
                            setErrors((er) => ({ ...er, pagamento: "" }));
                          }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">{opt.emoji}</span>
                            <span>{opt.label}</span>
                          </div>
                        </RadioCard>
                      ))}
                    </div>
                    <FieldError msg={errors.pagamento} />
                  </div>

                  {/* Envio */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-2">
                      Forma de envio <span className="text-[#D91672]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SHIPPING_OPTIONS.map((opt) => (
                        <RadioCard
                          key={opt.value}
                          selected={envio === opt.value}
                          onClick={() => {
                            setEnvio(opt.value);
                            setErrors((er) => ({ ...er, envio: "" }));
                          }}
                        >
                          <span className="text-lg">{opt.emoji}</span>
                          <span className="text-center">{opt.label}</span>
                        </RadioCard>
                      ))}
                    </div>
                    <FieldError msg={errors.envio} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Observação + Revisão ────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Observação */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#D91672] mb-3">
                    Observações
                  </p>
                  <textarea
                    placeholder="Ex: quero entrega rápida, tenho preferência de horário, etc. (opcional)"
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm resize-none outline-none focus:ring-2 focus:ring-[#D91672]/20 focus:border-[#D91672] transition-all"
                  />
                </div>

                {/* Revisão dos dados */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-3">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#D91672]">
                    Confirmação dos dados
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Nome</span>
                      <span className="font-medium text-zinc-800">{nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">WhatsApp</span>
                      <span className="font-medium text-zinc-800">{telefone}</span>
                    </div>
                    {local && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Local</span>
                        <span className="font-medium text-zinc-800">
                          {local}
                          {bairro ? ` — ${bairro}` : ""}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-zinc-100 pt-2 flex justify-between">
                      <span className="text-zinc-400">Pagamento</span>
                      <span className="font-medium text-zinc-800">{pagamento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Envio</span>
                      <span className="font-medium text-zinc-800">{envio}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-[#D91672] hover:underline font-medium mt-1"
                  >
                    ← Editar dados
                  </button>
                </div>

                {/* Info */}
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Nossa equipe entrará em contato para confirmar disponibilidade, pagamento e
                    entrega.
                  </p>
                </div>
              </div>
            )}

            {/* ── Resumo do Pedido (sempre visível) ───────────────────────── */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100">
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
                <Package className="h-3.5 w-3.5 text-[#D91672]" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#D91672]">
                  Resumo do pedido
                </span>
                <span className="ml-auto text-xs text-zinc-400">
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </span>
              </div>
              <div className="divide-y divide-zinc-50">
                {items.map(({ cartItemId, product, qty, selectedSize, selectedColor }) => (
                  <div key={cartItemId} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                      {(product as any).image_url || (product as any).imagem ? (
                        <img
                          src={(product as any).image_url || (product as any).imagem}
                          alt={product.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-zinc-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{product.nome}</p>
                      <p className="text-[11px] text-zinc-400">
                        {[
                          selectedColor && `${selectedColor}`,
                          selectedSize && `Tam. ${selectedSize}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        {" · "}
                        {qty}x
                      </p>
                    </div>
                    <span className="text-xs font-bold text-zinc-900 shrink-0">
                      {formatPrice((product.precoPromocional ?? product.preco) * qty)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-[#D91672]/5 border-t border-[#D91672]/10 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-700">Total</span>
                <span className="text-lg font-bold text-[#D91672]">{formatPrice(subtotal)}</span>
              </div>
            </div>

            <div className="h-1" />
          </div>
        </div>

        {/* ── Footer Navigation ────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-4 bg-white border-t border-zinc-100 flex gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="h-12 px-5 rounded-xl border-2 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 font-semibold text-sm flex items-center gap-1.5 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-5 rounded-xl border-2 border-zinc-200 text-zinc-400 hover:border-zinc-300 text-sm font-medium transition-all"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              Continuar
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-[#D91672] hover:bg-[#c11363] active:scale-[.98] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D91672]/25 disabled:opacity-60 disabled:cursor-not-allowed"
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
    </div>
  );
}
