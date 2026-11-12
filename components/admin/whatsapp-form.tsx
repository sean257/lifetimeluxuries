"use client";
import { useState, useTransition } from "react";
import { saveWhatsAppNumber } from "@/app/actions/settings";
import { Field, inputClass } from "@/components/admin/form-bits";
import { cleanWhatsApp } from "@/lib/settings-schema";
import { formatPhoneDisplay } from "@/lib/phone";
import { waLink } from "@/lib/whatsapp";

export function WhatsAppForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = cleanWhatsApp(value) !== saved;

  return (
    <form
      noValidate
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await saveWhatsAppNumber(value);
          if (res.ok) {
            setSaved(res.value ?? cleanWhatsApp(value));
            setValue(res.value ?? cleanWhatsApp(value));
            setMsg({ ok: true, text: res.message });
          } else setMsg({ ok: false, text: res.error });
        });
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-[280px]">
          <Field id="wa-number" label="WhatsApp number">
            <input
              id="wa-number"
              inputMode="numeric"
              autoComplete="off"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setMsg(null);
              }}
              aria-invalid={msg ? !msg.ok : undefined}
              aria-describedby="wa-msg wa-hint"
              className={`${inputClass} num`}
            />
          </Field>
        </div>
        <button type="submit" className="btn btn-solid" disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save number"}
        </button>
        <a className="btn btn-ghost" href={waLink(saved)} target="_blank" rel="noopener">
          Test this number
        </a>
      </div>
      <p id="wa-hint" className="text-xs text-muted">
        Now sending orders to <span className="num">{formatPhoneDisplay(saved)}</span>. &quot;Test this number&quot; opens that chat.
      </p>
      <div id="wa-msg" role={msg && !msg.ok ? "alert" : "status"} className={`min-h-[1em] text-[13px] ${msg?.ok ? "text-ok" : "text-bad"}`}>
        {msg?.text}
      </div>
    </form>
  );
}
