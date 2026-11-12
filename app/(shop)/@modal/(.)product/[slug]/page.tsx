import { notFound } from "next/navigation";
import { Modal } from "@/components/modal";
import { ProductDetail } from "@/components/product-detail";
import { getProductBySlug, getProducts, getWhatsAppNumber } from "@/lib/shop";

export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductModal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, whatsapp] = await Promise.all([getProductBySlug(slug), getWhatsAppNumber()]);
  if (!product) notFound();
  const titleId = `product-title-${product.id}`;
  return (
    <Modal labelledBy={titleId}>
      <ProductDetail product={product} whatsapp={whatsapp} headingLevel="h2" titleId={titleId} inModal />
    </Modal>
  );
}
