import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { PhotoManager } from "@/components/admin/photo-manager";
import { requireAdmin } from "@/lib/admin";
import { getAdminProduct } from "@/lib/admin-products";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; failed?: string }> };

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const [{ id }, { created, failed }] = await Promise.all([params, searchParams]);
  const failedCount = Number.parseInt(failed ?? "0", 10) || 0;
  const product = await getAdminProduct(supabase, id);
  if (!product) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/products" className="inline-flex min-h-11 items-center text-[13px] text-muted no-underline hover:text-ink">
          ← All products
        </Link>
        {product.is_published ? (
          <Link href={`/product/${product.slug}`} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center text-[13px] text-muted underline hover:text-ink">
            View in shop
          </Link>
        ) : null}
      </div>
      <AdminPageHeader title={product.name} />
      {created ? (
        failedCount ? (
          <p role="alert" className="-mt-3 text-[13px] text-bad">
            Product created, but {failedCount} photo{failedCount === 1 ? "" : "s"} didn&apos;t upload. Add {failedCount === 1 ? "it" : "them"} again below.
          </p>
        ) : (
          <p role="status" className="-mt-3 text-[13px] text-ok">
            Product created.{product.images.length ? "" : " Add photos below."}
          </p>
        )
      ) : null}

      <PhotoManager
        key={product.images.map((i) => i.id).join()}
        productId={product.id}
        productName={product.name}
        initial={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, width: i.width, height: i.height }))}
      />

      <ProductForm
        id={product.id}
        initial={{
          name: product.name,
          slug: product.slug,
          category: product.category,
          subtitle: product.subtitle ?? "",
          description: product.description ?? "",
          price: String(Math.round(product.price)),
          stock: String(product.stock),
          badge: product.badge ?? "",
          is_featured: product.is_featured,
          is_published: product.is_published,
          specs: product.specs,
        }}
      />
    </>
  );
}
