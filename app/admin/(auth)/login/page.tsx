import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin, safeAdminPath } from "@/lib/admin";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  if (await getAdmin()) redirect(safeAdminPath(next));
  return (
    <LoginForm
      next={safeAdminPath(next)}
      linkError={error === "link" ? "That link has expired or was already used. Ask for a new one below." : undefined}
    />
  );
}
