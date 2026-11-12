import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand";
import { NavLinks } from "@/components/nav-links";
import { BagButton } from "@/components/bag-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 border-b border-line bg-bg/92 backdrop-blur-[8px]">
      <div className="wrap flex items-center justify-between gap-6 py-3 sm:justify-start">
        <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="Lifetime Luxuries home">
          <LogoMark className="h-10 w-[34px] flex-none" />
          <Wordmark />
        </Link>
        <NavLinks />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <BagButton />
        </div>
      </div>
    </header>
  );
}
