"use client";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { DayValue } from "@/lib/orders";

const W = 640;
const H = 240;
const L = 52;
const R = 10;
const T = 26;
const B = 30;

const dayLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
const longLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const asDate = (day: string) => new Date(`${day}T00:00:00Z`);

function niceStep(max: number) {
  if (max > 20000) return 5000;
  if (max > 8000) return 2000;
  if (max > 2000) return 1000;
  if (max > 800) return 500;
  return 200;
}

/** Value of orders placed per day (single series, rose; today at full strength). */
export function SalesChart({ days }: { days: DayValue[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxV = Math.max(...days.map((d) => d.value), 1);
  const step = niceStep(maxV);
  const top = Math.ceil(maxV / step) * step;
  const cw = (W - L - R) / days.length;
  const y = (v: number) => T + (H - T - B) * (1 - v / top);
  const last = days.length - 1;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);

  const hovered = hover !== null ? days[hover] : undefined;
  const empty = days.every((d) => d.value === 0);

  return (
    <div className="relative">
      {empty ? (
        <p className="absolute inset-x-0 top-[38%] text-center text-[13px] text-muted">No sales in the last 14 days yet.</p>
      ) : null}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Daily sales for the last 14 days. The same figures are in the table below."
        className="block h-auto w-full touch-manipulation"
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--color-line)" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted)" className="num">
              {formatPrice(v)}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = L + i * cw + cw * 0.18;
          const w = cw * 0.64;
          const h = y(0) - y(d.value);
          const r = Math.min(4, h, w / 2);
          const active = hover === i;
          return (
            <g key={d.day}>
              {d.value > 0 ? (
                <path
                  d={`M${x},${y(0)} V${y(d.value) + r} Q${x},${y(d.value)} ${x + r},${y(d.value)} H${x + w - r} Q${x + w},${y(d.value)} ${x + w},${y(d.value) + r} V${y(0)} Z`}
                  fill="var(--color-rose)"
                  opacity={i === last || active ? 1 : 0.75}
                />
              ) : null}
              {i % 2 === 1 || i === last ? (
                <text x={x + w / 2} y={H - 10} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                  {i === last ? "Today" : dayLabel.format(asDate(d.day))}
                </text>
              ) : null}
              {/* Hit target: the whole column, bigger than the bar. */}
              <rect
                x={L + i * cw}
                y={T}
                width={cw}
                height={H - T - B}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onClick={() => setHover(hover === i ? null : i)}
              />
            </g>
          );
        })}
        {hovered && hover !== null ? (
          <g pointerEvents="none">
            {(() => {
              const cx = Math.min(Math.max(L + hover * cw + cw / 2, L + 80), W - R - 80);
              const label = `${longLabel.format(asDate(hovered.day))}: ${formatPrice(hovered.value)} · ${hovered.orders} ${hovered.orders === 1 ? "order" : "orders"}`;
              return (
                <>
                  <rect x={cx - 92} y={2} width={184} height={20} rx={2} fill="var(--color-ink)" />
                  <text x={cx} y={16} textAnchor="middle" fontSize={11} fill="var(--color-bg)" className="num">
                    {label}
                  </text>
                </>
              );
            })()}
          </g>
        ) : null}
      </svg>
      <table className="sr-only">
        <caption>Sales per day, last 14 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Orders</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <td>{longLabel.format(asDate(d.day))}</td>
              <td>{d.orders}</td>
              <td>{formatPrice(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
