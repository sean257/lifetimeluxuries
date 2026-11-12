"use client";
import { useState, useTransition } from "react";
import { saveAdminNotes } from "@/app/actions/orders";
import { inputClass } from "@/components/admin/form-bits";

export function AdminNotesForm({ orderRef, initial }: { orderRef: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = notes.trim() !== saved.trim();

  return (
    <form
      className="grid gap-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await saveAdminNotes({ ref: orderRef, notes });
          if (res.ok) {
            setSaved(notes);
            setMsg({ ok: true, text: res.message ?? "Saved" });
          } else {
            setMsg({ ok: false, text: res.error });
          }
        });
      }}
    >
      <label htmlFor="admin-notes" className="sr-only">
        Internal notes
      </label>
      <textarea
        id="admin-notes"
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setMsg(null);
        }}
        maxLength={2000}
        rows={4}
        placeholder="Paid by EcoCash, ref 123… Courier tracking… Only you can see this."
        aria-describedby="admin-notes-msg"
        className={`${inputClass} resize-y`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-solid" disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save notes"}
        </button>
        <span id="admin-notes-msg" role={msg && !msg.ok ? "alert" : "status"} className={`text-[13px] ${msg?.ok ? "text-ok" : "text-bad"}`}>
          {msg?.text}
        </span>
      </div>
    </form>
  );
}
