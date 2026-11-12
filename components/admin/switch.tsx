"use client";

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full border transition-colors disabled:opacity-50 ${
        checked ? "border-rose bg-rose" : "border-line bg-tile"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute size-[18px] rounded-full bg-surface shadow-none transition-transform ${checked ? "translate-x-[21px]" : "translate-x-[2px]"}`}
      />
    </button>
  );
}
