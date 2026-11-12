"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/watches", label: "Watches" },
  { href: "/accessories", label: "Accessories" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="ml-auto hidden gap-[22px] text-[13px] uppercase tracking-[0.08em] sm:flex">
      {LINKS.map((l) => {
        const current = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={current ? "page" : undefined}
            className={`py-1 no-underline hover:text-ink ${current ? "text-ink" : "text-muted"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
