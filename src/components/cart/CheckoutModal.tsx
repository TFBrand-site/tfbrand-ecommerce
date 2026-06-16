import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/lib/bag-store";
import { formatPrice } from "@/data/products";
import { STORE_NAME, whatsappLink } from "@/lib/config";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, clear, setOpen: setCartOpen } = useCart();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [local, setLocal] = useState("");
  const [pagamento, setPagamento] = useState("PIX");
  const [envio, setEnvio] = useState("Retirada na Loja");
  const [obs, setObs] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) {
      toast.error("Preencha nome e celular");
      return;
    }

    const linhasProdutos = items.map(({ product, qty, selectedSize, selectedColor }) => {
      const sizeStr = selectedSize ? ` | Tam: ${selectedSize}` : "";
      const colorStr = selectedColor ? ` | Cor: ${selectedColor}` : "";
      const formatProductPrice = formatPrice(product.preco);
      const formatSubtotal = formatPrice(product.preco * qty);
      return `• ${product.nome} (REF ${product.referencia})${sizeStr}${colorStr} — ${qty}x ${formatProductPrice} = ${formatSubtotal}`;
    });

    const msg = [
      `TFBrand — Novo pedido`,
      ``,
      `Cliente: ${nome}`,
      `Telefone: ${telefone}`,
      local.trim() ? `Local: ${local}` : "",
      ``,
      `Itens:`,
      ...linhasProdutos,
      ``,
      `Subtotal: ${formatPrice(subtotal)}`,
      `Pagamento: ${pagamento}`,
      `Envio: ${envio}`,
      obs.trim() ? `\nObservação: ${obs}` : "",
    ]
      .filter((line) => line !== null && line !== undefined)
      .join("\n");

    window.open(whatsappLink(msg), "_blank");
    toast.success("Pedido gerado com sucesso!");
    clear();
    onClose();
    setCartOpen(false);
    setNome("");
    setTelefone("");
    setLocal("");
    setObs("");
    setPagamento("PIX");
    setEnvio("Retirada na Loja");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 flex flex-col">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Finalizar pedido</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para gerar o seu pedido no WhatsApp.
            </DialogDescription>
          </DialogHeader>
        </div>
        <ScrollArea className="flex-1 px-6 pb-2">
          <form id="checkout-form" onSubmit={submit} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tel">Celular / WhatsApp</Label>
                <Input
                  id="tel"
                  type="tel"
                  placeholder="(85) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="local">Local (Cidade/Estado)</Label>
                <Input
                  id="local"
                  placeholder="Ex: Fortaleza-CE"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={pagamento} onValueChange={setPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Link de Pagamento">Link de Pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Forma de Envio</Label>
                <Select value={envio} onValueChange={setEnvio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retirada na Loja">Retirada na Loja</SelectItem>
                    <SelectItem value="Motoboy">Motoboy</SelectItem>
                    <SelectItem value="Correios/Transportadora">Correios/Transportadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="obs">Observação (opcional)</Label>
              <Textarea id="obs" value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
            </div>
          </form>
        </ScrollArea>
        <div className="p-6 pt-2 bg-background border-t mt-4">
          <div className="flex items-center justify-between py-3 mb-2">
            <span className="text-sm text-muted-foreground">Total do Pedido</span>
            <span className="font-display text-xl font-semibold text-primary">
              {formatPrice(subtotal)}
            </span>
          </div>
          <Button
            type="submit"
            form="checkout-form"
            className="w-full rounded-full bg-[#D91672] hover:bg-[#c11363] text-white cursor-pointer transition py-6 font-semibold uppercase tracking-wider text-xs shadow-md"
            size="lg"
          >
            Enviar Pedido pelo WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
