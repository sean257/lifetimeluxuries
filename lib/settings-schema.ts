import { z } from "zod";

/** Strips spaces, dashes, brackets and a leading + so "+263 77 123 4567" is accepted. */
export function cleanWhatsApp(input: string): string {
  return input.replace(/[\s\-().]/g, "").replace(/^\+/, "");
}

export const whatsappSchema = z
  .string()
  .transform(cleanWhatsApp)
  .refine((v) => !v.startsWith("0"), "Use the international format without the leading 0, for example 263771234567.")
  .refine((v) => /^[0-9]{10,15}$/.test(v), "Use 10 to 15 digits in international format, for example 263771234567.");

export const DELIVERY_CODE_RE = /^[a-z0-9_]+$/;

export const deliveryRowSchema = z.object({
  /** Empty for a new option; the server makes one from the label. */
  code: z.union([z.literal(""), z.string().regex(DELIVERY_CODE_RE).max(40)]),
  label: z.string().trim().min(1, "Each delivery option needs a name.").max(60, "Keep delivery names under 60 characters."),
  is_active: z.boolean(),
});

export const deliveryListSchema = z
  .array(deliveryRowSchema)
  .min(1, "Keep at least one delivery option.")
  .max(20, "Up to 20 delivery options.")
  .refine((rows) => rows.some((r) => r.is_active), "Keep at least one option switched on, or customers can't order.");

export type DeliveryRow = z.input<typeof deliveryRowSchema>;

/** "Courier to Bulawayo" -> "courier_to_bulawayo", unique among `taken`. */
export function deliveryCode(label: string, taken: Set<string>): string {
  const base =
    label
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 30) || "option";
  let code = base;
  for (let n = 2; taken.has(code); n++) code = `${base}_${n}`;
  return code;
}
