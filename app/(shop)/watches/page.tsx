import type { Metadata } from "next";
import { Catalogue } from "@/components/catalogue";
import { toCard } from "@/lib/types";
import { getProducts } from "@/lib/shop";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Watches",
  description: "Automatic, chronograph, diver and dress watches for men. Order on WhatsApp from Lifetime Luxuries, Harare.",
  alternates: { canonical: "/watches" },
};

export default async function WatchesPage() {
  const products = await getProducts();
  return (
    <main id="main" className="wrap pt-10">
      <Catalogue products={products.map(toCard)} initialFilter="watch" />
    </main>
  );
}
