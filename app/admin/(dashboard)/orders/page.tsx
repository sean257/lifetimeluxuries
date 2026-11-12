import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/admin/panel";
import { StatusSelect } from "@/components/admin/status-select";
import { requireAdmin } from "@/lib/admin";
import { formatDay, formatTime } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUSES, STATUS_LABEL, isOrderStatus, type OrderStatus } from "@/lib/order-status";
import { PAGE_SIZE, countByStatus, listOrders, type Order } from "@/lib/orders";
import { customerReplyText, formatPhoneDisplay } from "@/lib/phone";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Orders" };

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

function href(status?: OrderStatus, page?: number) {
  const p = new URLSearchParams();
  if (status) p.set("status", status);
  if (page && page > 1) p.set("page", String(page));
  const q = p.toString();
  return `/admin/orders${q ? `?${q}` : ""}`;
}

function PhoneLink({ o }: { o: Order }) {
  return (
    <a
      className="num text-xs text-muted underline hover:text-ink"
      target="_blank"
      rel="noopener"
      href={waLink(o.customer_phone, customerReplyText(o.customer_name, o.ref))}
      aria-label={`WhatsApp ${o.customer_name} on ${formatPhoneDisplay(o.customer_phone)}`}
    >
      {formatPhoneDisplay(o.customer_phone)}
    </a>
  );
}

function Items({ o }: { o: Order }) {
  return (
    <>
      {o.order_items.map((i) => (
        <span key={i.id} className="block">
          {i.qty} × {i.product_name}
        </span>
      ))}
      {o.notes ? <span className="mt-0.5 block text-xs text-muted">“{o.notes}”</span> : null}
    </>
  );
}

export default async function OrdersPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const status = isOrderStatus(sp.status) ? sp.status : undefined;
  const pageNum = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const [{ orders, total, page }, counts] = await Promise.all([
    listOrders(supabase, { status, page: pageNum }),
    countByStatus(supabase),
  ]);
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader title="Orders" description="Newest first. Tap a customer number to reply on WhatsApp." />

      <nav aria-label="Filter by status" className="-mb-2 flex flex-wrap gap-2">
        <Link href={href()} className="chip num" aria-current={!status ? "page" : undefined}>
          All {all}
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={href(s)} className="chip num" aria-current={status === s ? "page" : undefined}>
            {STATUS_LABEL[s]} {counts[s]}
          </Link>
        ))}
      </nav>

      <Panel>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            {status ? `No ${STATUS_LABEL[status].toLowerCase()} orders.` : "No orders yet. They appear here as soon as a customer sends one."}
          </p>
        ) : (
          <>
            {/* Phone: cards */}
            <ul className="grid gap-px bg-line min-[860px]:hidden">
              {orders.map((o) => (
                <li key={o.id} className="grid gap-2 bg-surface py-4 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/admin/orders/${o.ref}`} className="num font-medium underline-offset-4 hover:underline">
                      {o.ref}
                    </Link>
                    <span className="num text-xs text-muted">
                      {formatDay(o.created_at)}, {formatTime(o.created_at)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block">{o.customer_name}</span>
                      <PhoneLink o={o} />
                    </span>
                    <span className="num font-display text-xl font-semibold">{formatPrice(o.total)}</span>
                  </div>
                  <div className="text-[13.5px]">
                    <Items o={o} />
                  </div>
                  <div className="text-xs text-muted">{o.delivery_label}</div>
                  <div className="flex items-end justify-between gap-3">
                    <StatusSelect orderRef={o.ref} status={o.status} />
                    <Link href={`/admin/orders/${o.ref}`} className="btn btn-ghost px-3.5 py-2 text-xs">
                      Details
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto min-[860px]:block">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr className="text-left text-[11px] tracking-[0.12em] text-muted uppercase">
                    <th className="border-b border-line px-2.5 py-2.5 font-medium">Order</th>
                    <th className="border-b border-line px-2.5 py-2.5 font-medium">Placed</th>
                    <th className="border-b border-line px-2.5 py-2.5 font-medium">Customer</th>
                    <th className="border-b border-line px-2.5 py-2.5 font-medium">Items</th>
                    <th className="border-b border-line px-2.5 py-2.5 font-medium">Delivery</th>
                    <th className="border-b border-line px-2.5 py-2.5 text-right font-medium">Total</th>
                    <th className="border-b border-line px-2.5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="align-top hover:bg-bg">
                      <td className="border-b border-line px-2.5 py-3">
                        <Link href={`/admin/orders/${o.ref}`} className="num font-medium underline-offset-4 hover:underline">
                          {o.ref}
                        </Link>
                      </td>
                      <td className="num border-b border-line px-2.5 py-3">
                        {formatDay(o.created_at)}
                        <span className="block text-xs text-muted">{formatTime(o.created_at)}</span>
                      </td>
                      <td className="border-b border-line px-2.5 py-3">
                        <span className="block">{o.customer_name}</span>
                        <PhoneLink o={o} />
                      </td>
                      <td className="border-b border-line px-2.5 py-3">
                        <Items o={o} />
                      </td>
                      <td className="border-b border-line px-2.5 py-3 text-xs text-muted">{o.delivery_label}</td>
                      <td className="num border-b border-line px-2.5 py-3 text-right">{formatPrice(o.total)}</td>
                      <td className="border-b border-line px-2.5 py-3">
                        <StatusSelect orderRef={o.ref} status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 ? (
              <nav aria-label="Pages" className="mt-5 flex items-center justify-between gap-3 text-[13px]">
                {page > 1 ? (
                  <Link href={href(status, page - 1)} className="btn btn-ghost px-3.5 py-2 text-xs">
                    Newer
                  </Link>
                ) : (
                  <span />
                )}
                <span className="num text-muted">
                  Page {page} of {pages}
                </span>
                {page < pages ? (
                  <Link href={href(status, page + 1)} className="btn btn-ghost px-3.5 py-2 text-xs">
                    Older
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </>
        )}
      </Panel>
    </>
  );
}
