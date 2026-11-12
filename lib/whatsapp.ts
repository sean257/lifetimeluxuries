/** https://wa.me/<number>?text=<message> */
export function waLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const HERO_WA_TEXT = "Hello Lifetime Luxuries, I'd like to ask about your watches.";

export function productEnquiryText(name: string, price: string): string {
  return `Hello Lifetime Luxuries, I'm interested in the ${name} (${price}). Is it available?`;
}
