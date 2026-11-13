import { ProductGallery } from "@/components/product-gallery";
import { PurchasePanel } from "@/components/purchase-panel";
import { formatPrice, stockNote } from "@/lib/format";
import { productEnquiryText, waLink } from "@/lib/whatsapp";
import { CATEGORY_LABEL, type Product } from "@/lib/types";

type Props = { product: Product; whatsapp: string; headingLevel?: "h1" | "h2"; titleId?: string; inModal?: boolean };

export function ProductDetail({ product, whatsapp, headingLevel = "h1", titleId, inModal }: Props) {
  const Heading = headingLevel;
  const price = formatPrice(product.price);
  return (
    <div className="grid bg-surface min-[721px]:grid-cols-[1.2fr_1fr]">
      <ProductGallery product={product} className="min-[721px]:sticky min-[721px]:top-0 min-[721px]:self-start" />
      <div className="flex min-w-0 flex-col gap-3.5 px-5 py-6 min-[721px]:px-[30px] min-[721px]:py-[34px]">
        <div className="eyebrow">
          {CATEGORY_LABEL[product.category]}
          {product.subtitle ? ` · ${product.subtitle}` : ""}
        </div>
        <Heading id={titleId} className="text-4xl">
          {product.name}
        </Heading>
        <div className="num text-xl">{price}</div>
        {product.description ? <p className="text-muted">{product.description}</p> : null}
        {product.specs.length ? (
          <dl className="my-1 grid grid-cols-[auto_1fr] gap-x-[18px] gap-y-1.5 border-t border-line pt-3.5 text-[13px]">
            {product.specs.map((s, i) => (
              <div key={`${s.label}-${i}`} className="contents">
                <dt className="pt-0.5 text-[11px] uppercase tracking-[0.1em] text-muted">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className={`text-xs ${product.stock <= 0 ? "text-bad" : "text-muted"}`}>{stockNote(product.stock)}</div>
        <PurchasePanel productId={product.id} name={product.name} stock={product.stock} inModal={inModal} />
        <a
          className="btn btn-ghost"
          target="_blank"
          rel="noopener"
          href={waLink(whatsapp, productEnquiryText(product.name, price))}
        >
          Ask about this on WhatsApp
        </a>
      </div>
    </div>
  );
}
