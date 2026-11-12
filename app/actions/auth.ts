"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeAdminPath } from "@/lib/admin";
import { createRateLimiter } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export type AuthState = { error?: string; message?: string; email?: string };

const loginLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 });
const resetLimiter = createRateLimiter({ limit: 3, windowMs: 10 * 60 * 1000 });

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

const emailSchema = z.email("Enter the email address you sign in with.").trim().toLowerCase().max(254);

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(200),
  next: z.string().optional(),
});

const WRONG = "That email and password don't match. Check them and try again.";

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email };

  if (!loginLimiter.check(await clientIp())) {
    return { error: "Too many sign-in attempts. Wait 10 minutes and try again.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Confirm this email address in Supabase first.", email };
    return { error: WRONG, email };
  }

  // Only the owner may use the dashboard. Anyone else is signed straight out.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: WRONG, email };
  }

  redirect(safeAdminPath(parsed.data.next));
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email };

  if (!resetLimiter.check(await clientIp())) {
    return { error: "Too many reset requests. Wait 10 minutes and try again.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/admin/reset-password`,
  });
  if (error) console.error("resetPasswordForEmail failed", error.message);
  // Same answer either way, so the form can't be used to discover accounts.
  return { message: "If that email has an account, a reset link is on its way. Check your inbox and spam folder.", email };
}

const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The two passwords don't match.", path: ["confirm"] });

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Ask for a new one from the sign-in page." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { error: "Choose a password you haven't used here before." };
    if (error.code === "weak_password") return { error: "Choose a stronger password: longer, with a mix of characters." };
    return { error: "We couldn't save that password. Try again." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
