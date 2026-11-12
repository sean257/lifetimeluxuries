import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { NewProductEditor } from "@/components/admin/new-product-editor";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <div>
        <Link href="/admin/products" className="inline-flex min-h-11 items-center text-[13px] text-muted no-underline hover:text-ink">
          ← All products
        </Link>
      </div>
      <AdminPageHeader title="Add product" description="Fill in the details, add photos, then create the product." />
      <NewProductEditor />
    </>
  );
}
