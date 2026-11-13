"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { ProductArt } from "@/components/product-art";
import { Lightbox } from "@/components/lightbox";
import type { Product } from "@/lib/types";

const arrowBtn =
  "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/90 text-ink backdrop-blur-sm hover:bg-surface disabled:pointer-events-none disabled:opacity-0";

/**
 * Product photos: the whole photo is shown (never cropped) in a large frame.
 * Swipe or use the arrows to move between photos; tap a photo to open the
 * zoomable full-screen viewer.
 */
export function ProductGallery({ product, className = "" }: { product: Product; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const images = product.images;
  const count = images.length;

  if (count === 0) {
    return (
      <ProductArt
        product={product}
        sizes="(max-width: 720px) 100vw, 560px"
        priority
        className={`aspect-[4/5] min-[721px]:aspect-square ${className}`}
        markClassName="w-[34%]"
      />
    );
  }

  const go = (i: number) => {
    const el = track.current;
    const next = Math.max(0, Math.min(count - 1, i));
    if (el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    }
    setActive(next);
  };

  return (
    <div className={`flex min-w-0 flex-col bg-tile ${className}`}>
      <div className="relative">
        <div
          ref={track}
          tabIndex={count > 1 ? 0 : undefined}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] focus-visible:outline-offset-[-2px] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              go(active + 1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              go(active - 1);
            }
          }}
          aria-roledescription="carousel"
          aria-label={`Photos of ${product.name}`}
        >
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative aspect-[4/5] w-full flex-none snap-center min-[721px]:aspect-square"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              <button
                type="button"
                onClick={() => setViewer(i)}
                className="absolute inset-0 cursor-zoom-in"
                aria-label={`Zoom photo ${i + 1} of ${product.name}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || product.name}
                  fill
                  sizes="(max-width: 720px) 100vw, 560px"
                  priority={i === 0}
                  className="object-contain p-3 min-[721px]:p-5"
                />
              </button>
            </div>
          ))}
        </div>

        {count > 1 ? (
          <>
            <button type="button" className={`${arrowBtn} left-3`} onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous photo">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button type="button" className={`${arrowBtn} right-3`} onClick={() => go(active + 1)} disabled={active === count - 1} aria-label="Next photo">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="num pointer-events-none absolute bottom-3 left-3 rounded-full bg-surface/90 px-2.5 py-0.5 text-xs" aria-live="polite">
              {active + 1} / {count}
            </span>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setViewer(active)}
          className="absolute right-3 bottom-3 z-10 grid size-10 place-items-center rounded-full border border-line bg-surface/90 text-ink backdrop-blur-sm hover:bg-surface"
          aria-label="Open photo full screen to zoom"
        >
          <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4.2-4.2M11 8v6M8 11h6" />
          </svg>
        </button>
      </div>

      {count > 1 ? (
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
              <Image src={img.url} alt="" fill sizes="56px" className="object-contain p-0.5" />
            </button>
          ))}
        </div>
      ) : null}

      {viewer !== null ? (
        <Lightbox
          images={images}
          name={product.name}
          index={viewer}
          onIndex={(i) => {
            setViewer(i);
            go(i);
          }}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </div>
  );
}
