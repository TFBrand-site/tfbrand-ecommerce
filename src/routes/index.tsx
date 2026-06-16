import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { Lancamentos } from "@/components/home/Lancamentos";
import { BestSellers } from "@/components/home/BestSellers";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingCartBar } from "@/components/cart/FloatingCartBar";
import { FloatingWhatsAppButton } from "@/components/common/FloatingWhatsAppButton";
import { NewsletterFooter } from "@/components/common/NewsletterFooter";
import { Toaster } from "@/components/ui/sonner";
import { getPublicProducts } from "@/lib/services/products.service";

export const Route = createFileRoute("/")({
  loader: async () => {
    const products = await getPublicProducts();
    return { products };
  },
  head: () => ({
    meta: [
      { title: "TFBrand | Moda Feminina Online" },
      {
        name: "description",
        content:
          "Conheça a TFBrand, boutique feminina online com peças selecionadas, lançamentos e compra simples pelo WhatsApp.",
      },
      { property: "og:title", content: "TFBrand | Moda Feminina Online" },
      {
        property: "og:description",
        content:
          "Conheça a TFBrand, boutique feminina online com peças selecionadas, lançamentos e compra simples pelo WhatsApp.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  const { products } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Header showCategories />
      <main>
        <Hero />
        <Lancamentos products={products} />
        <BestSellers products={products} />
      </main>
      <NewsletterFooter />
      <Footer />
      <FloatingWhatsAppButton />
      <FloatingCartBar />
      <CartDrawer />
      <Toaster position="top-center" />
    </div>
  );
}
