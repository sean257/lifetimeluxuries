"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOGUE_TAG } from "@/lib/supabase/public";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { ORDER_REF_RE, ORDER_STATUSES, STATUS_LABEL } from "@/lib/order-status";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const NOT_ALLOWED: ActionResult = { ok: false, error: "Your session has ended. Sign in again." };

const statusInput = z.object({
  ref: z.string().regex(ORDER_REF_RE),
  status: z.enum(ORDER_STATUSES),
});

export async function updateOrderStatus(raw: unknown): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ALLOWED;
  const parsed = statusInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Choose a valid status." };

  // The database trigger deducts or restores stock when the status changes.
  const { data, error } = await admin.supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("ref", parsed.data.ref)
    .select("ref")
    .maybeSingle();
  if (error) {
    console.error("update status failed", error);
    return { ok: false, error: "Couldn't change the status. Try again." };
  }
  if (!data) return { ok: false, error: `Order ${parsed.data.ref} no longer exists.` };

  revalidatePath("/admin", "layout");
  // Paid/Delivered/Cancelled change stock, which the shop shows.
  if (parsed.data.status !== "new" && parsed.data.status !== "confirmed") {
    revalidateTag(CATALOGUE_TAG);
    revalidatePath("/", "layout");
  }
  return { ok: true, message: `${parsed.data.ref} marked ${STATUS_LABEL[parsed.data.status]}` };
}

const notesInput = z.object({
  ref: z.string().regex(ORDER_REF_RE),
  notes: z.string().trim().max(2000, "Keep notes under 2,000 characters."),
});

export async function saveAdminNotes(raw: unknown): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ALLOWED;
  const parsed = notesInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the notes and try again." };

  const { data, error } = await admin.supabase
    .from("orders")
    .update({ admin_notes: parsed.data.notes || null })
    .eq("ref", parsed.data.ref)
    .select("ref")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Couldn't save the notes. Try again." };
  revalidatePath(`/admin/orders/${parsed.data.ref}`);
  return { ok: true, message: "Notes saved" };
}
