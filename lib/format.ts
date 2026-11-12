const usd = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Whole US dollars: 1450 -> "$1,450". */
export function formatPrice(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return "$" + usd.format(Math.round(Number.isFinite(n) ? n : 0));
}

/** Stock line shown on the product page. */
export function stockNote(stock: number): string {
  if (stock <= 0) return "Sold out. Message us to be told when it is back.";
  if (stock <= 2) return `Only ${stock} left`;
  return "In stock";
}
