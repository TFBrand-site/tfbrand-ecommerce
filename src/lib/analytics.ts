declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Registrar pageview
export const pageview = (url: string) => {
  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) return;
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Eventos específicos
export const trackEvent = (action: string, params?: Record<string, unknown>) => {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, params);
};

export const trackViewProduct = (productId: string, productName: string, value?: number) => {
  trackEvent("view_item", {
    items: [
      {
        item_id: productId,
        item_name: productName,
        price: value,
      },
    ],
    value: value,
    currency: "BRL",
  });
};

export const trackAddToCart = (productId: string, productName: string, value?: number) => {
  trackEvent("add_to_cart", {
    items: [
      {
        item_id: productId,
        item_name: productName,
        price: value,
      },
    ],
    value: value,
    currency: "BRL",
  });
};

export const trackWhatsappCheckout = (value?: number) => {
  trackEvent("whatsapp_checkout", {
    value: value,
    currency: "BRL",
  });
};

export const trackSearch = (searchTerm: string, resultsCount: number, origin: string) => {
  trackEvent("search", {
    search_term: searchTerm,
    results_count: resultsCount,
    search_origin: origin,
  });
};
