/** The shop works in Harare time, whatever the server or browser timezone. */
export const SHOP_TZ = "Africa/Harare";

const dayMonth = new Intl.DateTimeFormat("en-GB", { timeZone: SHOP_TZ, day: "numeric", month: "short" });
const time = new Intl.DateTimeFormat("en-GB", { timeZone: SHOP_TZ, hour: "2-digit", minute: "2-digit" });
const full = new Intl.DateTimeFormat("en-GB", {
  timeZone: SHOP_TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** "12 Nov" */
export const formatDay = (d: Date | string) => dayMonth.format(new Date(d));
/** "14:05" */
export const formatTime = (d: Date | string) => time.format(new Date(d));
/** "Thu, 12 Nov 2026, 14:05" */
export const formatDateTime = (d: Date | string) => full.format(new Date(d));
/** Harare calendar day as YYYY-MM-DD. */
export const harareDay = (d: Date | string) => isoDay.format(new Date(d));

/** The last `n` Harare calendar days, oldest first, as YYYY-MM-DD. */
export function lastNDays(n: number, now = new Date()): string[] {
  const today = harareDay(now);
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(y, m - 1, d - i));
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}
