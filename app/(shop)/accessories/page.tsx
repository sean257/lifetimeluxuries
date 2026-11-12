import type { Metadata } from "next";
import { Catalogue } from "@/components/catalogue";
import { toCard } from "@/lib/types";
import { getProducts } from "@/lib/shop";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Accessories",
  description: "Leather straps, watch winders, cufflinks, bracelets and watch rolls. Order on WhatsApp from Lifetime Luxuries, Harare.",
  alternates: { canonical: "/accessories" },
};

export default async function AccessoriesPage() {
  const products = await getProducts();
  return (
    <main id="main" className="wrap pt-10">
      <Catalogue products={products.map(toCard)} initialFilter="accessory" />
    </main>
  );
}
