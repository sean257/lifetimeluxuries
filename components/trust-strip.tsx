const POINTS = [
  { title: "Checked before it ships", body: "Every watch is inspected and set before collection or delivery." },
  { title: "Harare & nationwide", body: "Free collection in Harare. Courier to any city." },
  { title: "Order through WhatsApp", body: "No card needed online. Pay once we confirm your order." },
];

export function TrustStrip() {
  return (
    <div className="mb-14 grid border-y border-line min-[701px]:grid-cols-3">
      {POINTS.map((p, i) => (
        <div
          key={p.title}
          className={`px-5 py-[18px] text-[13px] text-muted ${i > 0 ? "border-t border-line min-[701px]:border-t-0 min-[701px]:border-l" : ""}`}
        >
          <b className="block text-sm font-medium text-ink">{p.title}</b>
          {p.body}
        </div>
      ))}
    </div>
  );
}
