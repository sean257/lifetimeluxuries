import { env } from "@/lib/env";
import type { Product } from "@/lib/types";

export const SITE_NAME = "Lifetime Luxuries";

export const absoluteUrl = (path: string) => new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();

/** Meta description: first sentence-ish of the description, ≤160 chars. */
export function productDescription(p: Pick<Product, "name" | "description" | "subtitle" | "price">): string {
  const base = p.description?.trim() || [p.name, p.subtitle].filter(Boolean).join(" · ");
  return base.length > 160 ? base.slice(0, 157).replace(/\s+\S*$/, "") + "…" : base;
}

/** schema.org Product for search results. */
export function productJsonLd(p: Product) {
  const url = absoluteUrl(`/product/${p.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? p.subtitle ?? undefined,
    sku: p.slug,
    category: p.category === "watch" ? "Watches" : "Watch accessories",
    url,
    image: p.images.length ? p.images.map((i) => i.url) : [absoluteUrl("/opengraph-image")],
    brand: { "@type": "Brand", name: SITE_NAME },
    additionalProperty: p.specs.map((s) => ({ "@type": "PropertyValue", name: s.label, value: s.value })),
    offers: {
      "@type": "Offer",
      url,
      price: p.price.toFixed(2),
      priceCurrency: "USD",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
}

/** JSON for a <script type="application/ld+json">, safe against "</script>" in product text. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
