import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNotesForm } from "@/components/admin/admin-notes-form";
import { Panel } from "@/components/admin/panel";
import { StatusSelect } from "@/components/admin/status-select";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { ORDER_REF_RE } from "@/lib/order-status";
import { getOrderByRef } from "@/lib/orders";
import { customerReplyText, formatPhoneDisplay } from "@/lib/phone";
import { waLink } from "@/lib/whatsapp";

type Props = { params: Promise<{ ref: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params;
  return { title: ORDER_REF_RE.test(ref) ? `Order ${ref}` : "Order" };
}

export default async function OrderDetailPage({ params }: Props) {
  const { supabase } = await requireAdmin();
  const { ref } = await params;
  if (!ORDER_REF_RE.test(ref)) notFound();
  const order = await getOrderByRef(supabase, ref);
  if (!order) notFound();

  const phone = formatPhoneDisplay(order.customer_phone);

  return (
    <>
      <div>
        <Link href="/admin/orders" className="inline-flex min-h-11 items-center text-[13px] text-muted no-underline hover:text-ink">
          ← All orders
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Order</div>
            <h1 className="num text-[34px] min-[700px]:text-[40px]">{order.ref}</h1>
            <p className="num mt-1 text-sm text-muted">Placed {formatDateTime(order.created_at)}</p>
          </div>
          <StatusSelect orderRef={order.ref} status={order.status} />
        </div>
      </div>

      <div className="grid gap-[22px] min-[900px]:grid-cols-[3fr_2fr]">
        <Panel title="Items">
          <table className="w-full border-collapse text-sm">
            <thead className="sr-only">
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Price each</th>
                <th scope="col">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((i) => (
                <tr key={i.id} className="border-b border-line align-top">
                  <td className="py-2.5 pr-3">
                    <span className="block font-display text-lg leading-tight font-medium">{i.product_name}</span>
                    <span className="num text-xs text-muted">
                      {i.qty} × {formatPrice(i.unit_price)}
                    </span>
                  </td>
                  <td className="sr-only">{formatPrice(i.unit_price)}</td>
                  <td className="num py-2.5 text-right">{formatPrice(i.unit_price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="num mt-3.5 grid gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Delivery · {order.delivery_label}</dt>
              <dd className={order.delivery_fee ? "" : "text-muted"}>{order.delivery_fee ? formatPrice(order.delivery_fee) : "Agreed on WhatsApp"}</dd>
            </div>
            <div className="flex justify-between font-display text-lg font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">
            Prices are as they were when the order was placed. Stock comes off when you mark it Paid or Delivered, and
            goes back if you then cancel it.
          </p>
        </Panel>

        <div className="grid content-start gap-[22px]">
          <Panel title="Customer">
            <p className="text-base">{order.customer_name}</p>
            <p className="num text-sm text-muted">{phone}</p>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <a
                className="btn btn-solid"
                target="_blank"
                rel="noopener"
                href={waLink(order.customer_phone, customerReplyText(order.customer_name, order.ref))}
              >
                Reply on WhatsApp
              </a>
              <a className="btn btn-ghost" href={`tel:+${order.customer_phone}`}>
                Call
              </a>
            </div>
            {order.notes ? (
              <div className="mt-4 border-t border-line pt-3.5">
                <div className="text-[11px] tracking-[0.14em] text-muted uppercase">Customer&apos;s notes</div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            ) : null}
          </Panel>

          <Panel title="Internal notes" sub="Only you see these. The customer never does.">
            <AdminNotesForm orderRef={order.ref} initial={order.admin_notes ?? ""} />
          </Panel>
        </div>
      </div>
    </>
  );
}
