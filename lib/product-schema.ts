import { z } from "zod";
import { SLUG_RE } from "@/lib/slug";

export const MAX_PHOTOS = 8;
export const BADGE_PRESETS = ["New", "Best seller"] as const;

const optionalText = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null);

export const specSchema = z.object({
  label: z.string().trim().min(1, "Each spec row needs a label, or remove the row.").max(40, "Keep spec labels under 40 characters."),
  value: z.string().trim().min(1, "Each spec row needs a value, or remove the row.").max(200, "Keep spec values under 200 characters."),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Add a product name.").max(120, "Keep the name under 120 characters."),
  slug: z
    .string()
    .trim()
    .min(1, "Add a web address.")
    .max(80, "Keep the web address under 80 characters.")
    .regex(SLUG_RE, "Use lowercase letters, numbers and single dashes only, e.g. regent-chronograph-42."),
  category: z.enum(["watch", "accessory"], { message: "Choose Watch or Accessory." }),
  subtitle: optionalText(120, "Keep the subtitle under 120 characters."),
  description: optionalText(4000, "Keep the description under 4,000 characters."),
  price: z.coerce
    .number({ message: "Enter a price in whole US dollars." })
    .int("Enter a price in whole US dollars, without cents.")
    .min(0, "Price can't be negative.")
    .max(1_000_000, "That price looks too high. Check it."),
  stock: z.coerce
    .number({ message: "Enter how many you have." })
    .int("Stock must be a whole number.")
    .min(0, "Stock can't be negative.")
    .max(100_000, "That stock number looks too high. Check it."),
  badge: optionalText(30, "Keep the badge under 30 characters."),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  specs: z.array(specSchema).max(20, "Up to 20 spec rows.").default([]),
});

export type ProductInput = z.input<typeof productInputSchema>;
export type ProductValues = z.output<typeof productInputSchema>;
export type ProductField = keyof ProductValues;
