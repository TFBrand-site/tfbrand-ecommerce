import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export type ImageContext = "card" | "thumb" | "detail" | "raw";

export function getOptimizedImageUrl(
  url: string,
  contextOrWidth?: ImageContext | number,
  quality: number = 80,
): string {
  if (!url) return "";

  let width = 0;
  if (typeof contextOrWidth === "number") {
    width = contextOrWidth;
  } else if (contextOrWidth === "card") {
    width = 600;
  } else if (contextOrWidth === "thumb") {
    width = 200;
  } else if (contextOrWidth === "detail") {
    width = 1200;
  }

  // 1. Se for uma URL do Cloudinary, aplica otimização baseada no contexto
  if (url.includes("res.cloudinary.com/")) {
    // Se o URL já contém f_auto/q_auto, nós evitamos duplicar (dependendo da versão) ou apenas assumimos a substituição.
    // O ideal é substituir o /upload/
    const params: string[] = ["f_auto", "q_auto"];

    if (width > 0) {
      params.push(`w_${width}`);
    }

    // Replace seguro para evitar sobrepor transforms repetidas
    if (url.match(/\/image\/upload\/(f_[^/]+,?[^/]*)\//)) {
      // Já tem transforms (ex: /upload/f_auto,q_auto,w_600/), removemos e colocamos o novo
      return url.replace(/\/image\/upload\/f_[^/]+\//, `/image/upload/${params.join(",")}/`);
    } else {
      return url.replace("/image/upload/", `/image/upload/${params.join(",")}/`);
    }
  }

  // Se a otimização não estiver ativada explicitamente, servimos a URL pública original do Supabase.
  // Isso previne quebras de imagens no plano gratuito (Free tier) do Supabase.
  const enableOptimization = import.meta.env.VITE_ENABLE_IMAGE_OPTIMIZATION === "true";
  if (!enableOptimization && url.includes("/storage/v1/object/public/")) {
    return url;
  }

  // Verifica se a URL é do Supabase Storage e a otimiza dinamicamente
  if (url.includes("/storage/v1/object/public/")) {
    let optimizedUrl = url.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );

    const params: string[] = [];
    if (width > 0) {
      params.push(`width=${width}`);
    }
    if (quality) {
      params.push(`quality=${quality}`);
    }

    if (params.length > 0) {
      optimizedUrl += `?${params.join("&")}`;
    }
    return optimizedUrl;
  }

  return url;
}
