import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type AdminContext = { supabase: Awaited<ReturnType<typeof createClient>>; user: User };

/**
 * For admin pages and layouts: no session -> login; signed in but not an
 * admin -> 404. Cached per request so layout and page share one check.
 */
export const requireAdmin = cache(async (): Promise<AdminContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) notFound();
  return { supabase, user };
});

/** For admin server actions: returns null instead of redirecting, so the action can answer. */
export async function getAdmin(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) return null;
  return { supabase, user };
}

/** Only same-site admin paths are allowed as a post-login destination. */
export function safeAdminPath(next: unknown, fallback = "/admin"): string {
  if (typeof next !== "string") return fallback;
  if (!/^\/admin(\/[A-Za-z0-9/_-]*)?(\?[A-Za-z0-9=&_-]*)?$/.test(next)) return fallback;
  if (next.startsWith("/admin/login")) return fallback;
  return next;
}
