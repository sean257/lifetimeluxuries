"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { LogoMark } from "@/components/brand";
import { useBag } from "@/components/bag-provider";
import { loadBag, placeOrder, type BagData } from "@/app/actions/checkout";
import { formatPrice } from "@/lib/format";
import { buildOrderMessage } from "@/lib/order-message";
import { isValidPhone } from "@/lib/phone";
import { useDialog } from "@/lib/use-dialog";
import { waLink } from "@/lib/whatsapp";

type Field = "name" | "phone" | "delivery" | "notes";
type Sent = { ref: string; message: string; whatsapp: string };

const fieldClass = "w-full rounded-[2px] border border-line bg-bg px-3 py-2.5 aria-[invalid=true]:border-bad";
const labelClass = "text-[11px] uppercase tracking-[0.14em] text-muted";

export function BagDrawer() {
  const bag = useBag();
  const { items, isOpen, close, setQty, remove, clear, toast } = bag;
  const panel = useRef<HTMLElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<BagData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", delivery: "", notes: "", website: "" });
  const [error, setError] = useState<{ text: string; field?: Field } | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const [pending, startTransition] = useTransition();

  const handleClose = useCallback(() => {
    close();
    setSent(null);
    setError(null);
    setNotice("");
  }, [close]);
  useDialog(panel, handleClose, isOpen);

  // Re-read prices, stock and delivery options whenever the drawer opens or the set of products changes.
  const idKey = items.map((i) => i.id).sort().join(",");
  useEffect(() => {
    if (!isOpen || sent) return;
    let cancelled = false;
    setLoadError(false);
    loadBag(idKey ? idKey.split(",") : [])
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, idKey, sent]);

  // Drop items that are no longer for sale and keep quantities within stock.
  useEffect(() => {
    if (!data || sent) return;
    const known = new Map(data.lines.map((l) => [l.id, l]));
    const removed: string[] = [];
    for (const item of items) {
      const line = known.get(item.id);
      if (!line) {
        remove(item.id);
        removed.push("An item");
      } else if (line.stock <= 0) {
        remove(item.id);
        removed.push(line.name);
      } else if (item.qty > line.stock) {
        setQty(item.id, line.stock);
      }
    }
    if (removed.length) setNotice(`${removed.join(", ")} sold out and ${removed.length === 1 ? "was" : "were"} removed from your bag.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (!data?.delivery.length) return;
    setForm((f) => (data.delivery.some((d) => d.code === f.delivery) ? f : { ...f, delivery: data.delivery[0]!.code }));
  }, [data]);

  const lines = useMemo(() => {
    if (!data) return [];
    const byId = new Map(data.lines.map((l) => [l.id, l]));
    return items.flatMap((i) => {
      const l = byId.get(i.id);
      return l && l.stock > 0 ? [{ ...l, qty: Math.min(i.qty, l.stock) }] : [];
    });
  }, [data, items]);

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const delivery = data?.delivery.find((d) => d.code === form.delivery);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (error?.field === key) setError(null);
  };

  const focusField = (field?: Field) => {
    if (field) requestAnimationFrame(() => document.getElementById(`bag-${field}`)?.focus());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    // Quick checks here; the server validates everything again.
    if (!form.name.trim()) {
      setError({ text: "Add your name so we know who the order is for.", field: "name" });
      return focusField("name");
    }
    if (!isValidPhone(form.phone)) {
      setError({ text: "Add a phone number we can reach you on, for example 077 123 4567.", field: "phone" });
      return focusField("phone");
    }
    setError(null);
    const typedPhone = form.phone.trim();
    startTransition(async () => {
      try {
        const res = await placeOrder({
          name: form.name,
          phone: form.phone,
          delivery: form.delivery,
          notes: form.notes,
          website: form.website,
          items: lines.map((l) => ({ product_id: l.id, qty: l.qty })),
        });
        if (!res.ok) {
          setError({ text: res.error, field: res.field });
          focusField(res.field);
          return;
        }
        const o = res.order;
        const message = buildOrderMessage({
          ref: o.ref,
          items: o.items,
          subtotal: o.subtotal,
          delivery_label: o.delivery_label,
          name: o.customer_name,
          phone: typedPhone,
          notes: o.notes,
        });
        setSent({ ref: o.ref, message, whatsapp: o.whatsapp_number });
        clear();
        setForm((f) => ({ ...f, notes: "" }));
        panel.current?.focus();
      } catch {
        setError({ text: "We couldn't reach the shop. Check your connection and try again." });
      }
    });
  };

  const copy = async () => {
    if (!sent) return;
    try {
      await navigator.clipboard.writeText(sent.message);
      toast("Message copied");
    } catch {
      const el = msgRef.current;
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      toast("Message selected. Copy it from here.");
    }
  };

  if (!isOpen) return null;

  const title = sent ? `Order ${sent.ref}` : "Your bag";
  const loading = !data && !loadError && items.length > 0;

  return (
    <>
      <div data-keep-live className="animate-veil fixed inset-0 z-40 bg-veil" onClick={handleClose} aria-hidden="true" />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bag-title"
        tabIndex={-1}
        className="animate-drawer fixed top-0 right-0 bottom-0 z-50 flex w-[min(440px,100%)] flex-col bg-surface pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)] shadow-[-20px_0_60px_rgba(0,0,0,0.15)] outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-[22px] py-[18px]">
          <h2 id="bag-title" className="text-[26px]">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="px-2 py-1 text-[26px] leading-none text-muted hover:text-ink"
          >
            ×
          </button>
        </div>

        {sent ? (
          <div className="flex flex-1 flex-col gap-[18px] overflow-auto px-[22px] py-[18px]">
            <p>
              Your order is ready to send. Open WhatsApp and press send, and we will reply to confirm stock, payment
              and delivery.
            </p>
            <a className="btn btn-solid w-full" target="_blank" rel="noopener" href={waLink(sent.whatsapp, sent.message)}>
              Open WhatsApp
            </a>
            <div className="flex flex-col gap-1.5">
              <span className={labelClass} id="msg-label">
                Your message
              </span>
              <div
                ref={msgRef}
                aria-labelledby="msg-label"
                className="border-l-2 border-rose bg-tile p-3.5 text-[13px] whitespace-pre-wrap select-all"
              >
                {sent.message}
              </div>
            </div>
            <button type="button" className="btn btn-ghost w-full" onClick={copy}>
              Copy message
            </button>
            <p className="text-xs text-muted">
              If WhatsApp does not open, copy the message and send it to{" "}
              <a href={waLink(sent.whatsapp)} target="_blank" rel="noopener" className="num">
                +{sent.whatsapp}
              </a>
              .
            </p>
          </div>
        ) : items.length === 0 && !notice ? (
          <div className="flex flex-1 flex-col items-center gap-6 overflow-auto px-[22px] py-10 text-center text-muted">
            <p>Your bag is empty.</p>
            <button type="button" className="btn btn-ghost" onClick={handleClose}>
              Browse the collection
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-[18px] overflow-auto px-[22px] py-[18px]">
              {notice ? <p className="text-[13px] text-bad">{notice}</p> : null}
              {loadError ? (
                <p className="text-[13px] text-bad">We couldn&apos;t load your bag. Check your connection and reopen it.</p>
              ) : null}
              {loading ? <p className="py-6 text-center text-[13px] text-muted">Loading your bag…</p> : null}

              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-6 py-6 text-center text-muted">
                  <p>Your bag is empty.</p>
                  <button type="button" className="btn btn-ghost" onClick={handleClose}>
                    Browse the collection
                  </button>
                </div>
              ) : null}

              {lines.length ? (
                <ul className="flex flex-col gap-[18px]">
                  {lines.map((l) => (
                    <li key={l.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-3.5">
                      <Link
                        href={`/product/${l.slug}`}
                        onClick={handleClose}
                        className="relative grid aspect-[4/5] place-items-center overflow-hidden bg-tile"
                        aria-label={l.name}
                      >
                        {l.image ? (
                          <Image src={l.image.url} alt={l.image.alt} fill sizes="64px" className="object-cover" />
                        ) : (
                          <LogoMark className="h-auto w-[44%]" />
                        )}
                      </Link>
                      <div className="min-w-0">
                        <b className="block font-display text-lg leading-tight font-medium">{l.name}</b>
                        <span className="num text-xs text-muted">{formatPrice(l.price)}</span>
                        <div className="mt-1.5 flex items-center">
                          <span className="inline-flex items-center border border-line" role="group" aria-label={`Quantity of ${l.name}`}>
                            <button
                              type="button"
                              className="h-9 w-9 text-[15px] disabled:opacity-40"
                              aria-label={`One less ${l.name}`}
                              disabled={l.qty <= 1}
                              onClick={() => setQty(l.id, l.qty - 1)}
                            >
                              −
                            </button>
                            <span className="num min-w-[22px] text-center text-[13px]">{l.qty}</span>
                            <button
                              type="button"
                              className="h-9 w-9 text-[15px] disabled:opacity-40"
                              aria-label={`One more ${l.name}`}
                              disabled={l.qty >= l.stock}
                              onClick={() => setQty(l.id, l.qty + 1)}
                            >
                              +
                            </button>
                          </span>
                          <button
                            type="button"
                            className="ml-1.5 min-h-9 px-1.5 text-xs text-muted underline hover:text-ink"
                            onClick={() => remove(l.id)}
                            aria-label={`Remove ${l.name}`}
                          >
                            Remove
                          </button>
                        </div>
                        {l.qty >= l.stock ? (
                          <span className="mt-1 block text-[11px] text-warn">
                            {l.stock === 1 ? "Only 1 in stock" : `All ${l.stock} in stock`}
                          </span>
                        ) : null}
                      </div>
                      <div className="num">{formatPrice(l.price * l.qty)}</div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {lines.length ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="bag-name" className={labelClass}>
                      Your name
                    </label>
                    <input
                      id="bag-name"
                      autoComplete="name"
                      value={form.name}
                      onChange={update("name")}
                      maxLength={120}
                      aria-invalid={error?.field === "name"}
                      aria-describedby={error?.field === "name" ? "bag-error" : undefined}
                      className={fieldClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="bag-phone" className={labelClass}>
                      Phone number
                    </label>
                    <input
                      id="bag-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="077 123 4567"
                      value={form.phone}
                      onChange={update("phone")}
                      maxLength={30}
                      aria-invalid={error?.field === "phone"}
                      aria-describedby={error?.field === "phone" ? "bag-error" : undefined}
                      className={fieldClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="bag-delivery" className={labelClass}>
                      Delivery
                    </label>
                    <select
                      id="bag-delivery"
                      value={form.delivery}
                      onChange={update("delivery")}
                      aria-invalid={error?.field === "delivery"}
                      className={fieldClass}
                    >
                      {data?.delivery.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="bag-notes" className={labelClass}>
                      Notes (optional)
                    </label>
                    <textarea
                      id="bag-notes"
                      placeholder="Address, strap size, gift wrapping…"
                      value={form.notes}
                      onChange={update("notes")}
                      maxLength={1000}
                      className={`${fieldClass} min-h-16 resize-y`}
                    />
                  </div>
                  {/* Honeypot: hidden from people and screen readers. */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label htmlFor="bag-website">Website</label>
                    <input
                      id="bag-website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={update("website")}
                    />
                  </div>
                  <div className="num grid gap-1.5 border-t border-line pt-3.5 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span className="text-muted">Calculated after you order</span>
                    </div>
                    <div className="flex justify-between font-display text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <p className="font-body text-xs font-normal text-muted">Excludes delivery.</p>
                  </div>
                </>
              ) : null}
            </div>

            {lines.length ? (
              <div className="grid gap-2.5 border-t border-line px-[22px] py-4">
                <div id="bag-error" role="alert" className="min-h-[1em] text-[13px] text-bad">
                  {error?.text}
                </div>
                <button type="submit" className="btn btn-solid w-full" disabled={pending || !delivery}>
                  {pending ? "Sending…" : "Send order on WhatsApp"}
                </button>
                <p className="text-center text-xs text-muted">
                  We confirm stock, the delivery fee and payment with you in the chat. Nothing is charged here.
                </p>
              </div>
            ) : null}
          </form>
        )}
      </aside>
    </>
  );
}
