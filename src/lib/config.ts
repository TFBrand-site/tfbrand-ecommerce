// TFBrand — configurações principais. Edite aqui para alterar contato.
export const STORE_NAME = "TFBrand";
export const STORE_TAGLINE = "Moda feminina com elegância, atitude e exclusividade.";
export const WHATSAPP_NUMBER = "5585999973965"; // Apenas dígitos com DDI+DDD
export const INSTAGRAM_URL = "https://www.instagram.com/tfbrand___/";
export const CONTACT_EMAIL = "tfbrandteck@gmail.com";

export const whatsappLink = (text: string) => {
  const encodedText = encodeURIComponent(text);
  const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    return `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodedText}`;
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;
};
