"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDeliveryOption, saveDeliveryOptions } from "@/app/actions/settings";
import { Switch } from "@/components/admin/switch";
import { inputClass } from "@/components/admin/form-bits";

export type DeliveryFormRow = { key: string; code: string; label: string; is_active: boolean };

let counter = 0;
const newKey = () => `new-${Date.now()}-${counter++}`;

export function DeliveryForm({ initial }: { initial: DeliveryFormRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const strip = (list: DeliveryFormRow[]) => JSON.stringify(list.map((r) => [r.code, r.label, r.is_active]));
  const dirty = strip(rows) !== strip(initial);

  const patch = (i: number, p: Partial<DeliveryFormRow>) => {
    setRows((list) => list.map((r, j) => (j === i ? { ...r, ...p } : r)));
    setMsg(null);
    setRowErrors((e) => ({ ...e, [i]: "" }));
  };
  const move = (i: number, d: number) => {
    const to = i + d;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [m] = next.splice(i, 1);
    next.splice(to, 0, m!);
    setRows(next);
    setMsg(null);
  };

  const remove = (i: number) => {
    const row = rows[i]!;
    if (!row.code) {
      setRows((list) => list.filter((_, j) => j !== i));
      return;
    }
    if (!window.confirm(`Delete "${row.label}"? Customers won't see it any more.`)) return;
    startTransition(async () => {
      const res = await deleteDeliveryOption(row.code);
      if (res.ok) {
        setRows((list) => list.filter((r) => r.key !== row.key));
        setMsg({ ok: true, text: res.message });
        router.refresh();
      } else setMsg({ ok: false, text: res.error });
    });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveDeliveryOptions(rows.map(({ code, label, is_active }) => ({ code, label, is_active })));
      if (res.ok) {
        setRowErrors({});
        setMsg({ ok: true, text: res.message });
        router.refresh();
      } else {
        setRowErrors(res.rowErrors ?? {});
        setMsg({ ok: false, text: res.error });
      }
    });
  };

  return (
    <form onSubmit={save} noValidate className="grid gap-3">
      <div className="hidden grid-cols-[1fr_90px_auto] gap-3 text-[11px] tracking-[0.14em] text-muted uppercase min-[640px]:grid">
        <span>Name shown to customers</span>
        <span>Offered</span>
        <span className="sr-only">Actions</span>
      </div>
      <ul className="grid gap-3">
        {rows.map((r, i) => (
          <li key={r.key} className="grid gap-1.5 border-b border-line pb-3 min-[640px]:border-0 min-[640px]:pb-0">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 min-[640px]:grid-cols-[1fr_90px_auto]">
              <label className="sr-only" htmlFor={`dl-label-${i}`}>
                Delivery option {i + 1} name
              </label>
              <input
                id={`dl-label-${i}`}
                value={r.label}
                onChange={(e) => patch(i, { label: e.target.value })}
                maxLength={60}
                placeholder="Courier to Bulawayo"
                aria-invalid={!!rowErrors[i]}
                className={`${inputClass} col-span-2 min-[640px]:col-span-1`}
              />
              <span className="flex items-center gap-2">
                <Switch checked={r.is_active} onChange={(v) => patch(i, { is_active: v })} label={`Offer ${r.label || "this option"}`} />
                <span className="text-xs text-muted min-[640px]:sr-only">{r.is_active ? "Offered" : "Off"}</span>
              </span>
              <span className="flex justify-end gap-1">
                <button type="button" className="grid size-9 place-items-center border border-line text-muted hover:text-ink disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${r.label || "option"} up`}>
                  ↑
                </button>
                <button type="button" className="grid size-9 place-items-center border border-line text-muted hover:text-ink disabled:opacity-30" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${r.label || "option"} down`}>
                  ↓
                </button>
                <button type="button" className="grid size-9 place-items-center border border-line text-muted hover:text-bad" onClick={() => remove(i)} aria-label={`Delete ${r.label || "option"}`}>
                  ×
                </button>
              </span>
            </div>
            {rowErrors[i] ? <span className="text-xs text-bad">{rowErrors[i]}</span> : null}
          </li>
        ))}
      </ul>
      <div>
        <button
          type="button"
          className="btn btn-ghost px-3.5 py-2 text-xs"
          disabled={rows.length >= 20}
          onClick={() => {
            setRows((list) => [...list, { key: newKey(), code: "", label: "", is_active: true }]);
            setMsg(null);
            requestAnimationFrame(() => document.getElementById(`dl-label-${rows.length}`)?.focus());
          }}
        >
          Add delivery option
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button type="submit" className="btn btn-solid" disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save delivery options"}
        </button>
        <span role={msg && !msg.ok ? "alert" : "status"} className={`text-[13px] ${msg?.ok ? "text-ok" : "text-bad"}`}>
          {msg?.text}
        </span>
      </div>
    </form>
  );
}
