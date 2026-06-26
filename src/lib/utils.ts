import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getOptimizedImageUrl(url: string, width?: number, quality: number = 80): string {
  if (!url) return "";

  // Verifica se a URL é do Supabase Storage e a otimiza dinamicamente
  if (url.includes("/storage/v1/object/public/")) {
    let optimizedUrl = url.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );

    const params: string[] = [];
    if (width) {
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
