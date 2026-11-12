import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { TrustStrip } from "@/components/trust-strip";
import { Catalogue } from "@/components/catalogue";
import { toCard } from "@/lib/types";
import { getFeaturedProduct, getProducts, getWhatsAppNumber } from "@/lib/shop";
import { SITE_NAME, absoluteUrl, jsonLdString } from "@/lib/seo";

export const revalidate = 3600;
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [products, featured, whatsapp] = await Promise.all([
    getProducts(),
    getFeaturedProduct(),
    getWhatsAppNumber(),
  ]);
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString({
            "@context": "https://schema.org",
            "@type": "Store",
            name: SITE_NAME,
            url: absoluteUrl("/"),
            image: absoluteUrl("/opengraph-image"),
            description: "Men's luxury watches and accessories in Harare. Orders confirmed on WhatsApp.",
            telephone: `+${whatsapp}`,
            priceRange: "$$",
            currenciesAccepted: "USD",
            address: { "@type": "PostalAddress", addressLocality: "Harare", addressCountry: "ZW" },
          }),
        }}
      />
      <Hero featured={featured} whatsapp={whatsapp} />
      <div className="wrap">
        <TrustStrip />
        <Catalogue products={products.map(toCard)} />
      </div>
    </main>
  );
}
