"use client";
import { ErrorPanel } from "@/components/error-panel";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="wrap py-16">
      <ErrorPanel error={error} reset={reset} homeHref="/" homeLabel="Back to the shop" />
    </main>
  );
}
