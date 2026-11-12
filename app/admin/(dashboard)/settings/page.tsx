import type { Metadata } from "next";
import { z } from "zod";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/admin/panel";
import { WhatsAppForm } from "@/components/admin/whatsapp-form";
import { DeliveryForm } from "@/components/admin/delivery-form";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Settings" };

const deliveryRows = z.array(
  z.object({ code: z.string(), label: z.string(), fee: z.coerce.number(), is_active: z.boolean(), sort_order: z.number() }),
);

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [settingsRes, deliveryRes] = await Promise.all([
    supabase.from("settings").select("whatsapp_number").maybeSingle(),
    supabase.from("delivery_options").select("code, label, fee, is_active, sort_order").order("sort_order"),
  ]);
  if (settingsRes.error || deliveryRes.error) throw new Error("Could not load settings.");
  const delivery = deliveryRows.parse(deliveryRes.data ?? []);
  const formRows = delivery.map((d) => ({
    key: d.code,
    code: d.code,
    label: d.label,
    fee: String(Math.round(d.fee)),
    is_active: d.is_active,
  }));

  return (
    <>
      <AdminPageHeader title="Settings" />
      <Panel
        title="WhatsApp number"
        sub="Orders open a chat with this number. Use the full international format without “+”, for example 263771234567."
      >
        <WhatsAppForm initial={settingsRes.data?.whatsapp_number ?? ""} />
      </Panel>
      <Panel
        title="Delivery options"
        sub="Shown in the bag in this order. Switch an option off to stop offering it; past orders keep the name and fee they were placed with."
      >
        <DeliveryForm key={formRows.map((r) => `${r.code}:${r.label}:${r.fee}:${r.is_active}`).join("|")} initial={formRows} />
      </Panel>
    </>
  );
}
