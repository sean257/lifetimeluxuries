import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="wrap relative flex min-h-dvh flex-col items-center py-10">
      <ThemeToggle className="absolute top-4 right-4 size-10" />
      <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="Lifetime Luxuries shop">
        <LogoMark className="h-10 w-[34px] flex-none" />
        <Wordmark />
      </Link>
      <div className="mt-10 w-full max-w-[380px] border border-line bg-surface px-7 py-8 max-[400px]:px-5">{children}</div>
    </main>
  );
}
