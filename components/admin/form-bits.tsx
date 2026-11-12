export const inputClass =
  "w-full rounded-[2px] border border-line bg-bg px-3 py-2.5 aria-[invalid=true]:border-bad";
export const labelClass = "text-[11px] uppercase tracking-[0.14em] text-muted";

export function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function FormMessage({ id, error, message }: { id: string; error?: string; message?: string }) {
  return (
    <div id={id} role={error ? "alert" : "status"} className={`min-h-[1em] text-[13px] ${error ? "text-bad" : "text-ok"}`}>
      {error ?? message}
    </div>
  );
}
