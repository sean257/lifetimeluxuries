import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/admin/panel";
import { SalesChart } from "@/components/admin/sales-chart";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { getOverview } from "@/lib/orders";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const { supabase } = await requireAdmin();
  const o = await getOverview(supabase);
  const maxUnits = o.bestSellers[0]?.units ?? 1;

  const kpis = [
    { label: "Revenue, 30 days", value: formatPrice(o.revenue30), sub: "Paid and delivered orders" },
    { label: "Orders, 30 days", value: String(o.orders30), sub: "Excluding cancelled" },
    {
      label: "Needs a reply",
      value: String(o.newCount),
      sub: `${o.confirmedCount} confirmed, awaiting payment`,
      href: "/admin/orders?status=new",
    },
    { label: "Average order", value: formatPrice(o.averageOrder), sub: "Last 30 days" },
  ];

  return (
    <>
      <AdminPageHeader
        title="Orders & sales"
        description={
          <>
            Each order a customer sends through WhatsApp is logged here as <b className="font-medium">New</b>. Move it
            along as you confirm, take payment and deliver.
          </>
        }
        actions={
          <Link href="/admin/orders" className="btn btn-solid">
            View orders
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-px border border-line bg-line min-[760px]:grid-cols-4">
        {kpis.map((k) => {
          const body = (
            <>
              <div className="text-[11px] tracking-[0.14em] text-muted uppercase">{k.label}</div>
              <div className="num mt-1.5 font-display text-[30px] leading-[1.1] font-medium min-[700px]:text-[34px]">
                {k.value}
              </div>
              <div className="text-xs text-muted">{k.sub}</div>
            </>
          );
          return k.href ? (
            <Link key={k.label} href={k.href} className="bg-surface px-4 py-[18px] no-underline hover:bg-tile min-[700px]:px-5">
              {body}
            </Link>
          ) : (
            <div key={k.label} className="bg-surface px-4 py-[18px] min-[700px]:px-5">
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid gap-[22px] min-[900px]:grid-cols-[2fr_1fr]">
        <Panel title="Sales, last 14 days" sub="Value of orders placed per day, excluding cancelled orders">
          <SalesChart days={o.days} />
        </Panel>
        <Panel title="Best sellers" sub="Units ordered, last 30 days">
          {o.bestSellers.length ? (
            <ul className="grid gap-3">
              {o.bestSellers.map((b) => (
                <li key={b.name} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm">
                  <span>{b.name}</span>
                  <span className="num">{b.units}</span>
                  <span className="col-span-2 h-1 bg-tile" aria-hidden="true">
                    <i className="block h-full bg-rose" style={{ width: `${(b.units / maxUnits) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">No orders in the last 30 days yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
