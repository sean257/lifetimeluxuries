import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand";
import { AdminSideNav, AdminTabBar } from "@/components/admin/admin-nav";
import { signOut } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/admin";
import { SkipLink } from "@/components/skip-link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-dvh min-[900px]:grid min-[900px]:grid-cols-[232px_1fr]">
      <SkipLink />
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line bg-surface px-4 py-5 min-[900px]:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-2 no-underline" aria-label="Dashboard home">
          <LogoMark className="h-10 w-[34px] flex-none" />
          <Wordmark />
        </Link>
        <AdminSideNav />
        <Link href="/" target="_blank" rel="noopener" className="mt-auto px-3 text-[13px] text-muted underline hover:text-ink">
          View shop
        </Link>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-bg/92 backdrop-blur-[8px]">
          <div className="flex items-center gap-3 px-4 py-2.5 min-[900px]:px-8">
            <Link href="/admin" className="flex-none min-[900px]:hidden" aria-label="Dashboard home">
              <LogoMark className="h-9 w-[30px]" />
            </Link>
            <span className="ml-auto min-w-0 truncate text-[13px] text-muted" title={user.email}>
              {user.email}
            </span>
            <form action={signOut}>
              <button type="submit" className="btn btn-ghost px-3.5 py-2 text-xs">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="flex flex-col gap-7 outline-none px-4 pt-7 pb-[calc(88px+env(safe-area-inset-bottom,0px))] min-[900px]:px-8 min-[900px]:pb-16">
          {children}
        </main>
      </div>
      <AdminTabBar />
    </div>
  );
}
