import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand";

export default function NotFound() {
  return (
    <>
      <header className="border-b border-line">
        <div className="wrap py-3">
          <Link href="/" className="inline-flex items-center gap-2.5 no-underline" aria-label="Lifetime Luxuries home">
            <LogoMark className="h-10 w-[34px] flex-none" />
            <Wordmark />
          </Link>
        </div>
      </header>
      <main className="wrap grid min-h-[60vh] place-content-center gap-4 py-16 text-center">
        <div className="eyebrow">Not found</div>
        <h1 className="text-4xl">We couldn&apos;t find that page</h1>
        <p className="text-muted">It may have sold out or moved. The full collection is on the home page.</p>
        <div>
          <Link href="/" className="btn btn-solid">
            Browse the collection
          </Link>
        </div>
      </main>
    </>
  );
}
