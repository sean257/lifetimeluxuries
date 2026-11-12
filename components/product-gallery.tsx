"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { ProductArt } from "@/components/product-art";
import type { Product } from "@/lib/types";

/** Main photo with swipe (scroll-snap) on touch, and thumbnails to jump between photos. */
export function ProductGallery({ product, className = "" }: { product: Product; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const images = product.images;

  if (images.length <= 1) {
    return (
      <ProductArt
        product={product}
        sizes="(max-width: 720px) 100vw, 460px"
        priority
        className={className}
        markClassName="w-[34%]"
      />
    );
  }

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    setActive(i);
  };

  return (
    <div className={`flex min-w-0 flex-col bg-tile ${className}`}>
      <div
        ref={track}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          setActive(Math.round(el.scrollLeft / el.clientWidth));
        }}
        aria-roledescription="carousel"
        aria-label={`Photos of ${product.name}`}
      >
        {images.map((img, i) => (
          <div
            key={img.id}
            className="relative aspect-[4/5] w-full flex-none snap-center"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${images.length}`}
          >
            <Image
              src={img.url}
              alt={img.alt || product.name}
              fill
              sizes="(max-width: 720px) 100vw, 460px"
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto bg-surface p-2">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show photo ${i + 1}`}
            aria-current={i === active}
            className={`relative aspect-square w-14 flex-none border bg-tile ${i === active ? "border-rose" : "border-transparent"}`}
          >
            <Image src={img.url} alt="" fill sizes="56px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
