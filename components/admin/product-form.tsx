"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProduct, saveProduct } from "@/app/actions/products";
import { Panel } from "@/components/admin/panel";
import { Switch } from "@/components/admin/switch";
import { Field, inputClass } from "@/components/admin/form-bits";
import { BADGE_PRESETS, type ProductField } from "@/lib/product-schema";
import { slugify } from "@/lib/slug";
import type { Category, Spec } from "@/lib/types";

export type ProductFormValues = {
  name: string;
  slug: string;
  category: Category;
  subtitle: string;
  description: string;
  price: string;
  stock: string;
  badge: string;
  is_featured: boolean;
  is_published: boolean;
  specs: Spec[];
};

type BadgeMode = "none" | (typeof BADGE_PRESETS)[number] | "custom";

const EMPTY: ProductFormValues = {
  name: "",
  slug: "",
  category: "watch",
  subtitle: "",
  description: "",
  price: "",
  stock: "1",
  badge: "",
  is_featured: false,
  is_published: true,
  specs: [],
};

export function ProductForm({ id, initial }: { id: string | null; initial?: ProductFormValues }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(!!id);
  const [badgeMode, setBadgeMode] = useState<BadgeMode>(() => {
    const b = initial?.badge ?? "";
    if (!b) return "none";
    return (BADGE_PRESETS as readonly string[]).includes(b) ? (b as BadgeMode) : "custom";
  });
  const [errors, setErrors] = useState<Partial<Record<ProductField, string>>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setMsg(null);
    if (errors[key as ProductField]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onName = (name: string) => {
    set("name", name);
    if (!slugTouched) setV((prev) => ({ ...prev, name, slug: slugify(name) }));
  };

  const setSpec = (i: number, patch: Partial<Spec>) =>
    set(
      "specs",
      v.specs.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    );
  const moveSpec = (i: number, d: number) => {
    const to = i + d;
    if (to < 0 || to >= v.specs.length) return;
    const next = [...v.specs];
    const [m] = next.splice(i, 1);
    next.splice(to, 0, m!);
    set("specs", next);
  };

  const badgeValue = badgeMode === "none" ? "" : badgeMode === "custom" ? v.badge : badgeMode;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    startSave(async () => {
      const res = await saveProduct(id, {
        ...v,
        badge: badgeValue,
        // Drop rows left completely empty.
        specs: v.specs.filter((s) => s.label.trim() || s.value.trim()),
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setMsg({ ok: false, text: res.error });
        const first = res.fieldErrors && (Object.keys(res.fieldErrors)[0] as ProductField | undefined);
        if (first) document.getElementById(`pf-${first}`)?.focus();
        return;
      }
      setErrors({});
      if (!id) {
        router.replace(`/admin/products/${res.id}?created=1`);
      } else {
        setMsg({ ok: true, text: res.message });
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (!id) return;
    if (!window.confirm(`Delete ${v.name || "this product"} and all its photos? This can't be undone. Past orders keep their details.`)) return;
    startDelete(async () => {
      const res = await deleteProduct(id);
      if (res && !res.ok) setMsg({ ok: false, text: res.error });
    });
  };

  const err = (k: ProductField) =>
    errors[k] ? (
      <span id={`pf-${k}-err`} className="text-xs text-bad">
        {errors[k]}
      </span>
    ) : null;
  const a11y = (k: ProductField) => ({
    id: `pf-${k}`,
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `pf-${k}-err` : undefined,
  });

  const specErrors = errors.specs;

  return (
    <form onSubmit={submit} noValidate className="grid gap-[22px]">
      <div className="grid gap-[22px] min-[1000px]:grid-cols-[3fr_2fr]">
        <Panel title="Details">
          <div className="grid gap-4">
            <Field id="pf-name" label="Name">
              <input {...a11y("name")} value={v.name} onChange={(e) => onName(e.target.value)} maxLength={120} className={inputClass} />
              {err("name")}
            </Field>
            <Field id="pf-slug" label="Web address">
              <div className="flex items-stretch">
                <span className="hidden items-center border border-r-0 border-line bg-tile px-2.5 text-[13px] text-muted min-[480px]:flex">
                  /product/
                </span>
                <input
                  {...a11y("slug")}
                  value={v.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase());
                  }}
                  maxLength={80}
                  autoCapitalize="none"
                  spellCheck={false}
                  className={inputClass}
                />
              </div>
              {err("slug") ?? (
                <span className="text-xs text-muted">
                  {id ? "Changing this breaks links people have already shared." : "Filled in from the name. You can change it."}
                </span>
              )}
            </Field>
            <div className="grid gap-4 min-[560px]:grid-cols-2">
              <Field id="pf-category" label="Category">
                <select
                  {...a11y("category")}
                  value={v.category}
                  onChange={(e) => set("category", e.target.value as Category)}
                  className={inputClass}
                >
                  <option value="watch">Watch</option>
                  <option value="accessory">Accessory</option>
                </select>
              </Field>
              <Field id="pf-subtitle" label="Subtitle (optional)">
                <input
                  {...a11y("subtitle")}
                  value={v.subtitle}
                  onChange={(e) => set("subtitle", e.target.value)}
                  placeholder="Rose gold · moonphase"
                  maxLength={120}
                  className={inputClass}
                />
                {err("subtitle")}
              </Field>
            </div>
            <Field id="pf-description" label="Description (optional)">
              <textarea
                {...a11y("description")}
                value={v.description}
                onChange={(e) => set("description", e.target.value)}
                rows={5}
                maxLength={4000}
                className={`${inputClass} resize-y`}
              />
              {err("description")}
            </Field>
          </div>
        </Panel>

        <div className="grid content-start gap-[22px]">
          <Panel title="Price & stock">
            <div className="grid grid-cols-2 gap-4">
              <Field id="pf-price" label="Price (USD)">
                <input
                  {...a11y("price")}
                  value={v.price}
                  onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder="1450"
                  className={`${inputClass} num`}
                />
                {err("price")}
              </Field>
              <Field id="pf-stock" label="In stock">
                <input
                  {...a11y("stock")}
                  value={v.stock}
                  onChange={(e) => set("stock", e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  className={`${inputClass} num`}
                />
                {err("stock")}
              </Field>
            </div>
            <p className="mt-2 text-xs text-muted">Whole dollars. Stock of 0 shows as sold out.</p>
          </Panel>

          <Panel title="Shop display">
            <div className="grid gap-4">
              <div className="flex items-start justify-between gap-4">
                <label htmlFor="pf-is_published" className="text-sm">
                  Show in the shop
                  <span className="block text-xs text-muted">Off hides it from customers. You can still edit it.</span>
                </label>
                <Switch id="pf-is_published" checked={v.is_published} onChange={(x) => set("is_published", x)} label="Show in the shop" />
              </div>
              <div className="flex items-start justify-between gap-4">
                <label htmlFor="pf-is_featured" className="text-sm">
                  Feature on the home page
                  <span className="block text-xs text-muted">Only one product is featured. This replaces the current one.</span>
                </label>
                <Switch id="pf-is_featured" checked={v.is_featured} onChange={(x) => set("is_featured", x)} label="Feature on the home page" />
              </div>
              <Field id="pf-badge-mode" label="Badge">
                <select
                  id="pf-badge-mode"
                  value={badgeMode}
                  onChange={(e) => {
                    setBadgeMode(e.target.value as BadgeMode);
                    setMsg(null);
                  }}
                  className={inputClass}
                >
                  <option value="none">None</option>
                  {BADGE_PRESETS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="custom">Custom text…</option>
                </select>
              </Field>
              {badgeMode === "custom" ? (
                <Field id="pf-badge" label="Badge text">
                  <input
                    {...a11y("badge")}
                    value={v.badge}
                    onChange={(e) => set("badge", e.target.value)}
                    maxLength={30}
                    placeholder="Limited"
                    className={inputClass}
                  />
                  {err("badge")}
                </Field>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Specs" sub="Shown as a table on the product page, e.g. Case · 42 mm, stainless steel.">
        <div className="grid gap-2.5">
          {v.specs.length === 0 ? <p className="text-[13px] text-muted">No specs yet.</p> : null}
          {v.specs.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 min-[620px]:grid-cols-[180px_1fr_auto]">
              <label className="sr-only" htmlFor={`spec-label-${i}`}>
                Spec {i + 1} label
              </label>
              <input
                id={`spec-label-${i}`}
                value={s.label}
                onChange={(e) => setSpec(i, { label: e.target.value })}
                placeholder="Label, e.g. Case"
                maxLength={40}
                className={`${inputClass} col-span-2 min-[620px]:col-span-1`}
              />
              <label className="sr-only" htmlFor={`spec-value-${i}`}>
                Spec {i + 1} value
              </label>
              <input
                id={`spec-value-${i}`}
                value={s.value}
                onChange={(e) => setSpec(i, { value: e.target.value })}
                placeholder="Value, e.g. 42 mm, stainless steel"
                maxLength={200}
                className={inputClass}
              />
              <div className="flex gap-1">
                <button type="button" className="grid size-10 place-items-center border border-line text-muted hover:text-ink disabled:opacity-30" onClick={() => moveSpec(i, -1)} disabled={i === 0} aria-label={`Move spec ${i + 1} up`}>
                  ↑
                </button>
                <button type="button" className="grid size-10 place-items-center border border-line text-muted hover:text-ink disabled:opacity-30" onClick={() => moveSpec(i, 1)} disabled={i === v.specs.length - 1} aria-label={`Move spec ${i + 1} down`}>
                  ↓
                </button>
                <button type="button" className="grid size-10 place-items-center border border-line text-muted hover:text-bad" onClick={() => set("specs", v.specs.filter((_, j) => j !== i))} aria-label={`Remove spec ${i + 1}`}>
                  ×
                </button>
              </div>
            </div>
          ))}
          {specErrors ? (
            <p id="pf-specs" tabIndex={-1} className="text-xs text-bad">
              {specErrors}
            </p>
          ) : null}
          <div>
            <button
              type="button"
              className="btn btn-ghost px-3.5 py-2 text-xs"
              disabled={v.specs.length >= 20}
              onClick={() => set("specs", [...v.specs, { label: "", value: "" }])}
            >
              Add spec row
            </button>
          </div>
        </div>
      </Panel>

      <div className="sticky bottom-[calc(57px+env(safe-area-inset-bottom,0px))] z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur-[8px] min-[900px]:bottom-0 min-[900px]:-mx-8 min-[900px]:px-8">
        <button type="submit" className="btn btn-solid" disabled={saving || deleting}>
          {saving ? "Saving…" : id ? "Save changes" : "Create product"}
        </button>
        <Link href="/admin/products" className="btn btn-ghost">
          {id ? "Back to products" : "Cancel"}
        </Link>
        <span role={msg && !msg.ok ? "alert" : "status"} className={`text-[13px] ${msg?.ok ? "text-ok" : "text-bad"}`}>
          {msg?.text}
        </span>
        {id ? (
          <button
            type="button"
            onClick={remove}
            disabled={saving || deleting}
            className="ml-auto text-[13px] text-bad underline disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete product"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
