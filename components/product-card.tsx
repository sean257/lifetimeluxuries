import Link from "next/link";
import { ProductArt } from "@/components/product-art";
import { formatPrice } from "@/lib/format";
import type { CardProduct } from "@/lib/types";

export function ProductCard({ product, priority }: { product: CardProduct; priority?: boolean }) {
  const soldOut = product.stock <= 0;
  const tag = soldOut ? "Sold out" : product.badge;
  return (
    <Link
      href={`/product/${product.slug}`}
      scroll={false}
      className="group flex flex-col gap-2.5 text-left no-underline"
    >
      <ProductArt
        product={product}
        sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 290px"
        priority={priority}
        hoverZoom
        className="aspect-[4/5]"
      >
        {tag ? (
          <span
            className={`absolute top-3 left-3 bg-surface px-2 py-1 text-[10px] leading-normal uppercase tracking-[0.16em] ${soldOut ? "text-bad" : ""}`}
          >
            {tag}
          </span>
        ) : null}
      </ProductArt>
      <span className="flex items-baseline justify-between gap-3">
        <h3 className="text-[21px]">{product.name}</h3>
        <span className="num whitespace-nowrap text-sm">{formatPrice(product.price)}</span>
      </span>
      {product.subtitle ? <span className="-mt-1.5 text-[13px] text-muted">{product.subtitle}</span> : null}
    </Link>
  );
}
