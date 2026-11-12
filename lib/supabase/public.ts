import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Cookie-less anon client for public shop reads. Because it never touches
 * cookies, shop pages stay static and are refreshed with revalidatePath().
 * RLS limits it to published products, their photos, settings and active
 * delivery options.
 */
export function createPublicClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
