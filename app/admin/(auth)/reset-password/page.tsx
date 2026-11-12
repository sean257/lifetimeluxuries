import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=link");
  return <ResetPasswordForm email={user.email ?? ""} />;
}
