"use client";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { CardProduct, Category } from "@/lib/types";

type Filter = "all" | Category;
type Sort = "feat" | "lo" | "hi";

const TITLES: Record<Filter, string> = { all: "All pieces", watch: "Watches", accessory: "Accessories" };
const CHIPS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "watch", label: "Watches" },
  { value: "accessory", label: "Accessories" },
];

export function Catalogue({ products, initialFilter = "all" }: { products: CardProduct[]; initialFilter?: Filter }) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [sort, setSort] = useState<Sort>("feat");

  const list = useMemo(() => {
    const filtered = products.filter((p) => filter === "all" || p.category === filter);
    if (sort === "lo") return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "hi") return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [products, filter, sort]);

  return (
    <section id="catalogue" aria-labelledby="cat-title" className="scroll-mt-20">
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">The collection</div>
          <h2 id="cat-title" className="text-[clamp(30px,3.6vw,42px)]">
            {TITLES[filter]}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.value}
              type="button"
              className="chip"
              aria-pressed={filter === c.value}
              onClick={() => setFilter(c.value)}
            >
              {c.label}
            </button>
          ))}
          <select
            aria-label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px]"
          >
            <option value="feat">Featured</option>
            <option value="lo">Price: low to high</option>
            <option value="hi">Price: high to low</option>
          </select>
        </div>
      </div>

      {list.length ? (
        <div className="mb-[72px] grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-x-[22px] gap-y-8">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      ) : (
        <p className="mb-[72px] py-10 text-center text-muted">Nothing here yet. Check back soon.</p>
      )}
    </section>
  );
}
