import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductsList, type ListProduct } from "@/components/admin/products-list";
import { requireAdmin } from "@/lib/admin";
import { listAdminProducts } from "@/lib/admin-products";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const [products, { deleted }] = await Promise.all([listAdminProducts(supabase), searchParams]);
  const list: ListProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    category: p.category,
    price: p.price,
    stock: p.stock,
    is_published: p.is_published,
    is_featured: p.is_featured,
    thumb: p.images[0] ? { url: p.images[0].url, alt: p.images[0].alt ?? p.name } : null,
  }));

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Changes show in the shop straight away. Stock of 0 marks an item as sold out. Switch a product off to hide it."
        actions={
          <Link href="/admin/products/new" className="btn btn-solid">
            Add product
          </Link>
        }
      />
      {deleted ? (
        <p role="status" className="text-[13px] text-ok">
          Product deleted.
        </p>
      ) : null}
      <ProductsList initial={list} key={list.map((p) => p.id).join()} />
    </>
  );
}
