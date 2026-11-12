export function AvailabilityPill({ stock, published }: { stock: number; published: boolean }) {
  const [label, cls] = !published
    ? ["Hidden", "text-muted"]
    : stock <= 0
      ? ["Sold out", "text-bad"]
      : stock <= 2
        ? ["Low stock", "text-warn"]
        : ["Available", "text-ok"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap ${cls}`}>
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      {label}
    </span>
  );
}
