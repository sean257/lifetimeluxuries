import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeAdminPath } from "@/lib/admin";

const OTP_TYPES = new Set<EmailOtpType>(["recovery", "email", "magiclink", "invite", "signup", "email_change"]);

/**
 * Lands password-reset links. Handles both the default Supabase email
 * (?code=…, same browser only) and the token_hash template (any device).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeAdminPath(searchParams.get("next"), "/admin/reset-password");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type && OTP_TYPES.has(type)) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  } else if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  const url = request.nextUrl.clone();
  url.search = "";
  if (ok) {
    url.pathname = next;
  } else {
    url.pathname = "/admin/login";
    url.searchParams.set("error", "link");
  }
  return NextResponse.redirect(url);
}
