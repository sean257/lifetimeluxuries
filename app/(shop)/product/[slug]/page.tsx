import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { getProductBySlug, getProducts, getWhatsAppNumber } from "@/lib/shop";
import { jsonLdString, productDescription, productJsonLd } from "@/lib/seo";
import { formatPrice } from "@/lib/format";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  const description = productDescription(product);
  const main = product.images[0];
  const images = main
    ? [{ url: main.url, width: main.width ?? undefined, height: main.height ?? undefined, alt: main.alt || product.name }]
    : undefined; // falls back to the site's Open Graph image
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      url: `/product/${product.slug}`,
      title: `${product.name} · ${formatPrice(product.price)}`,
      description,
      ...(images ? { images } : {}),
    },
    twitter: { card: "summary_large_image", title: product.name, description, ...(images ? { images } : {}) },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [product, whatsapp] = await Promise.all([getProductBySlug(slug), getWhatsAppNumber()]);
  if (!product) notFound();
  const back = product.category === "watch" ? { href: "/watches", label: "Watches" } : { href: "/accessories", label: "Accessories" };
  return (
    <main id="main" className="wrap pt-6 pb-[72px] min-[721px]:pt-10">
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-[13px] text-muted">
        <Link href="/" className="inline-flex min-h-11 items-center no-underline hover:text-ink">
          Shop
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={back.href} className="inline-flex min-h-11 items-center no-underline hover:text-ink">
          {back.label}
        </Link>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd(product)) }} />
      <div className="mx-auto max-w-[1100px] border border-line">
        <ProductDetail product={product} whatsapp={whatsapp} />
      </div>
    </main>
  );
}
