"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOGUE_TAG } from "@/lib/supabase/public";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { DELIVERY_CODE_RE, deliveryCode, deliveryListSchema, whatsappSchema } from "@/lib/settings-schema";

export type SettingsResult =
  | { ok: true; message: string; value?: string }
  | { ok: false; error: string; rowErrors?: Record<number, string> };

const SESSION_ENDED = "Your session has ended. Sign in again.";

export async function saveWhatsAppNumber(raw: unknown): Promise<SettingsResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const parsed = whatsappSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the number." };

  const { data, error } = await admin.supabase
    .from("settings")
    .update({ whatsapp_number: parsed.data })
    .eq("id", true)
    .select("whatsapp_number")
    .maybeSingle();
  if (error || !data) {
    console.error("save whatsapp failed", error);
    return { ok: false, error: "Couldn't save the number. Try again." };
  }
  // Every shop page links to this number.
  revalidateTag(CATALOGUE_TAG);
  revalidatePath("/", "layout");
  return { ok: true, message: "Number saved. New orders go to this chat.", value: data.whatsapp_number };
}

export async function saveDeliveryOptions(raw: unknown): Promise<SettingsResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const parsed = deliveryListSchema.safeParse(raw);
  if (!parsed.success) {
    const rowErrors: Record<number, string> = {};
    let general: string | undefined;
    for (const issue of parsed.error.issues) {
      const row = issue.path[0];
      if (typeof row === "number") rowErrors[row] ??= issue.message;
      else general ??= issue.message;
    }
    return { ok: false, error: general ?? "Check the highlighted rows.", rowErrors };
  }

  const { supabase } = admin;
  const { data: existing, error: loadError } = await supabase.from("delivery_options").select("code");
  if (loadError) return { ok: false, error: "Couldn't save delivery options. Try again." };
  const known = new Set((existing ?? []).map((r) => r.code));
  const taken = new Set(known);

  const rows = parsed.data.map((r, i) => {
    let code = r.code;
    if (!code || !known.has(code)) {
      code = deliveryCode(r.label, taken);
      taken.add(code);
    }
    // Delivery fees are agreed with the customer after the order, so none is stored.
    return { code, label: r.label, fee: 0, is_active: r.is_active, sort_order: i + 1 };
  });

  const { error } = await supabase.from("delivery_options").upsert(rows, { onConflict: "code" });
  if (error) {
    console.error("save delivery options failed", error);
    return { ok: false, error: "Couldn't save delivery options. Try again." };
  }
  revalidatePath("/admin/settings");
  return { ok: true, message: "Delivery options saved" };
}

export async function deleteDeliveryOption(raw: unknown): Promise<SettingsResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const parsed = z.string().regex(DELIVERY_CODE_RE).max(40).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "That option no longer exists." };

  const { supabase } = admin;
  const { count } = await supabase
    .from("delivery_options")
    .select("code", { count: "exact", head: true })
    .eq("is_active", true)
    .neq("code", parsed.data);
  if (!count) return { ok: false, error: "Keep at least one option switched on, or customers can't order." };

  const { error } = await supabase.from("delivery_options").delete().eq("code", parsed.data);
  if (error) {
    if (error.code === "23503") {
      return { ok: false, error: "Past orders use this option, so it can't be deleted. Switch it off instead." };
    }
    console.error("delete delivery option failed", error);
    return { ok: false, error: "Couldn't delete that option. Try again." };
  }
  revalidatePath("/admin/settings");
  return { ok: true, message: "Option deleted" };
}
