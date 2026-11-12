import Image from "next/image";
import { LogoMark } from "@/components/brand";
import type { Product, ProductImage } from "@/lib/types";

type Props = {
  product: Pick<Product, "name" | "images">;
  image?: ProductImage;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Scale the picture on hover of a parent `.group`. */
  hoverZoom?: boolean;
  markClassName?: string;
  children?: React.ReactNode;
};

/** Product photo on the tile, or the crown mark centred on the tile when there are no photos. */
export function ProductArt({ product, image, sizes, priority, className = "", hoverZoom, markClassName = "w-[30%]", children }: Props) {
  const img = image ?? product.images[0];
  const zoom = hoverZoom ? "transition-transform duration-500 ease-out group-hover:scale-[1.04]" : "";
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-tile ${className}`}>
      {img ? (
        <Image
          src={img.url}
          alt={img.alt || product.name}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${zoom}`}
        />
      ) : (
        <LogoMark className={`h-auto ${markClassName} ${zoom}`} />
      )}
      {children}
    </div>
  );
}
