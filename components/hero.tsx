import Link from "next/link";
import { ProductArt } from "@/components/product-art";
import { formatPrice } from "@/lib/format";
import { HERO_WA_TEXT, waLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

export function Hero({ featured, whatsapp }: { featured: Product | null; whatsapp: string }) {
  return (
    <section className="wrap grid items-center gap-7 pt-8 pb-6 min-[821px]:grid-cols-[1.1fr_1fr] min-[821px]:gap-12 min-[821px]:pt-14 min-[821px]:pb-10">
      <div>
        <div className="eyebrow">Men&apos;s watches &amp; accessories · Harare</div>
        <h1 className="mt-3.5 mb-[18px] text-[clamp(38px,5.4vw,64px)] tracking-[-0.01em]">
          Timepieces chosen to be worn for a{" "}
          <em className="font-script text-[1.12em] font-normal not-italic text-rose">lifetime</em>
        </h1>
        <p className="mb-7 max-w-[46ch] text-base text-muted">
          Automatic, chronograph and dress watches for men, with straps, winders and cufflinks to match. Pick what
          you like, and we confirm price, stock and delivery with you on WhatsApp.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="btn btn-solid" href="/watches">
            Shop watches
          </Link>
          <a className="btn btn-ghost" href={waLink(whatsapp, HERO_WA_TEXT)} target="_blank" rel="noopener">
            Ask on WhatsApp
          </a>
        </div>
      </div>

      {featured ? (
        <Link
          href={`/product/${featured.slug}`}
          scroll={false}
          className="group block no-underline"
        >
          <ProductArt
            product={featured}
            sizes="(max-width: 820px) 100vw, 540px"
            priority
            className="aspect-square w-full"
            markClassName="w-[34%]"
          >
            <span className="absolute bottom-4 left-[18px] text-left text-[13px]">
              <span className="eyebrow block">Featured</span>
              <b className="block font-display text-xl font-medium">{featured.name}</b>
              <span className="num">{formatPrice(featured.price)}</span>
            </span>
          </ProductArt>
        </Link>
      ) : (
        <ProductArt product={{ name: "Lifetime Luxuries", images: [] }} sizes="540px" className="aspect-square w-full" markClassName="w-[34%]" />
      )}
    </section>
  );
}
