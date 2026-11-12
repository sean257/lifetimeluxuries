"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { reorderProducts, setPublished } from "@/app/actions/products";
import { LogoMark } from "@/components/brand";
import { AvailabilityPill } from "@/components/admin/availability-pill";
import { Switch } from "@/components/admin/switch";
import { inputClass } from "@/components/admin/form-bits";
import { formatPrice } from "@/lib/format";
import { CATEGORY_LABEL, type Category } from "@/lib/types";

export type ListProduct = {
  id: string;
  name: string;
  subtitle: string | null;
  category: Category;
  price: number;
  stock: number;
  is_published: boolean;
  is_featured: boolean;
  thumb: { url: string; alt: string } | null;
};

type Filter = "all" | Category;

export function ProductsList({ initial }: { initial: ListProduct[] }) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      items.filter(
        (p) =>
          (filter === "all" || p.category === filter) &&
          (!q || p.name.toLowerCase().includes(q) || (p.subtitle ?? "").toLowerCase().includes(q)),
      ),
    [items, filter, q],
  );
  const canReorder = filter === "all" && !q;

  const saveOrder = (next: ListProduct[], prev: ListProduct[], movedName: string) => {
    setItems(next);
    setError("");
    startTransition(async () => {
      const res = await reorderProducts(next.map((p) => p.id));
      if (!res.ok) {
        setItems(prev);
        setError(res.error);
      } else {
        setStatus(`${movedName} moved to position ${next.findIndex((p) => p.name === movedName) + 1}`);
      }
    });
  };

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(index, 1);
    next.splice(to, 0, m!);
    saveOrder(next, items, m!.name);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = items.findIndex((p) => p.id === dragId);
    const to = items.findIndex((p) => p.id === targetId);
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m!);
    saveOrder(next, items, m!.name);
  };

  const togglePublished = (id: string, value: boolean) => {
    const prev = items;
    setItems((list) => list.map((p) => (p.id === id ? { ...p, is_published: value } : p)));
    setError("");
    startTransition(async () => {
      const res = await setPublished(id, value);
      if (!res.ok) {
        setItems(prev);
        setError(res.error);
      } else setStatus(res.message ?? "");
    });
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <input
          id="product-search"
          type="search"
          placeholder="Search products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} max-w-[280px] bg-surface py-2`}
        />
        {(["all", "watch", "accessory"] as const).map((f) => (
          <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "watch" ? "Watches" : "Accessories"}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted">
        {canReorder
          ? "Drag a row, or use the arrows, to change the order products appear in the shop."
          : "Clear the search and choose All to change the order."}
      </p>
      <div role="status" className="sr-only">
        {status}
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-bad">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="border border-line bg-surface py-10 text-center text-sm text-muted">
          {items.length === 0 ? "No products yet. Add your first one." : "No products match. Try another search."}
        </p>
      ) : (
        <ul className="border border-line bg-surface">
          {filtered.map((p) => {
            const index = items.findIndex((x) => x.id === p.id);
            return (
              <li
                key={p.id}
                data-product-name={p.name}
                data-stock={p.stock}
                draggable={canReorder}
                onDragStart={() => setDragId(p.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => canReorder && e.preventDefault()}
                onDrop={() => dropOn(p.id)}
                className={`grid grid-cols-[48px_1fr_auto] items-center gap-x-3 gap-y-2 border-b border-line px-3 py-3 last:border-b-0 min-[760px]:grid-cols-[48px_1fr_110px_80px_70px_110px_auto_auto] min-[760px]:px-4 ${
                  dragId === p.id ? "opacity-50" : ""
                } ${canReorder ? "min-[760px]:cursor-grab" : ""}`}
              >
                <Link
                  href={`/admin/products/${p.id}`}
                  className="relative grid aspect-[4/5] w-12 place-items-center overflow-hidden bg-tile"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {p.thumb ? (
                    <Image src={p.thumb.url} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <LogoMark className="h-auto w-[50%]" />
                  )}
                </Link>
                <div className="min-w-0">
                  <Link href={`/admin/products/${p.id}`} className="block truncate font-display text-lg leading-tight font-medium hover:underline">
                    {p.name}
                  </Link>
                  <span className="block text-xs text-muted min-[760px]:hidden">
                    {CATEGORY_LABEL[p.category]} · <span className="num">{formatPrice(p.price)}</span> ·{" "}
                    <span className="num">{p.stock}</span> in stock
                  </span>
                  <span className="hidden truncate text-xs text-muted min-[760px]:block">
                    {p.subtitle}
                    {p.is_featured ? <span className="ml-1 text-rose">· Featured</span> : null}
                  </span>
                </div>
                <span className="hidden text-[13px] text-muted min-[760px]:block">{CATEGORY_LABEL[p.category]}</span>
                <span className="num hidden text-right text-[13px] min-[760px]:block">{formatPrice(p.price)}</span>
                <span className="num hidden text-right text-[13px] min-[760px]:block">{p.stock}</span>
                <span className="col-start-2 row-start-2 min-[760px]:col-auto min-[760px]:row-auto min-[760px]:pl-3">
                  <AvailabilityPill stock={p.stock} published={p.is_published} />
                </span>
                <span className="col-start-3 row-span-2 row-start-1 flex flex-col items-end gap-2 min-[760px]:col-auto min-[760px]:row-auto min-[760px]:flex-row min-[760px]:items-center">
                  <Switch
                    checked={p.is_published}
                    onChange={(v) => togglePublished(p.id, v)}
                    label={`Show ${p.name} in the shop`}
                  />
                </span>
                <span className="col-span-3 flex justify-end gap-1 min-[760px]:col-auto">
                  <button
                    type="button"
                    className="grid size-8 place-items-center border border-line text-muted hover:text-ink disabled:opacity-30"
                    disabled={!canReorder || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Move ${p.name} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="grid size-8 place-items-center border border-line text-muted hover:text-ink disabled:opacity-30"
                    disabled={!canReorder || index === items.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Move ${p.name} down`}
                  >
                    ↓
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
