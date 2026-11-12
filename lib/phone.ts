/** Digits only, with a leading local "0" turned into Zimbabwe's 263 (mirrors place_order). */
export function normalisePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.startsWith("0") ? "263" + digits.slice(1) : digits;
}

export function isValidPhone(input: string): boolean {
  return /^[0-9]{9,15}$/.test(normalisePhone(input));
}

/** Display a stored international number: 263772118430 -> "+263 77 211 8430". */
export function formatPhoneDisplay(stored: string): string {
  const d = stored.replace(/\D/g, "");
  const zw = /^263(\d{2})(\d{3})(\d{4})$/.exec(d);
  if (zw) return `+263 ${zw[1]} ${zw[2]} ${zw[3]}`;
  return `+${d}`;
}

/** First name for a friendly WhatsApp greeting. */
export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? "";
}

export function customerReplyText(customerName: string, ref: string): string {
  const name = firstName(customerName);
  return `Hello${name ? ` ${name}` : ""}, this is Lifetime Luxuries about your order ${ref}.`;
}
