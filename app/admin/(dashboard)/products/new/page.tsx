import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <div>
        <Link href="/admin/products" className="text-[13px] text-muted no-underline hover:text-ink">
          ← All products
        </Link>
      </div>
      <AdminPageHeader title="Add product" description="Fill in the details and create the product. You can add photos straight after." />
      <ProductForm id={null} />
    </>
  );
}
