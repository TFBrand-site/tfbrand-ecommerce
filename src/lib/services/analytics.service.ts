import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type AnalyticsEvent = Database["public"]["Tables"]["analytics_events"]["Insert"];

export const trackEvent = async (
  eventType: "view_product" | "add_to_cart" | "whatsapp_click",
  productId?: string,
) => {
  if (!isSupabaseConfigured()) return; // Não faz nada em ambiente mockado

  try {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;
    await supabase.from("analytics_events").insert([
      {
        event_type: eventType,
        product_id: productId || null,
        user_agent: userAgent,
      },
    ]);
  } catch (error) {
    console.error("Erro ao registrar evento analytics interno:", error);
    // Silent fail para não quebrar a UI
  }
};

// Funções para dashboard de admin
export const getEventStats = async () => {
  if (!isSupabaseConfigured()) {
    return { views: 0, cartAdds: 0, whatsappClicks: 0 };
  }

  const { data, error } = await supabase.from("analytics_events").select("event_type");
  if (error) return { views: 0, cartAdds: 0, whatsappClicks: 0 };

  return {
    views: data.filter((e) => e.event_type === "view_product").length,
    cartAdds: data.filter((e) => e.event_type === "add_to_cart").length,
    whatsappClicks: data.filter((e) => e.event_type === "whatsapp_click").length,
  };
};
