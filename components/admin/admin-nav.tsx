"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode };

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ITEMS: Item[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
    ),
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <circle cx="12" cy="12" r="5" />
        <path d="M9 7.5 10 2h4l1 5.5M9 16.5 10 22h4l1-5.5M12 10v2l1.5 1" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="10" cy="12" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    ),
  },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"));
}

/** Left sidebar links (desktop). */
export function AdminSideNav() {
  const isActive = useIsActive();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 border-l-2 px-3 py-2 text-sm no-underline ${
              active ? "border-rose bg-tile text-ink" : "border-transparent text-muted hover:bg-tile hover:text-ink"
            }`}
          >
            <span className={`size-5 flex-none ${active ? "text-rose" : ""}`}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom tab bar (mobile). */
export function AdminTabBar() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Dashboard"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] min-[900px]:hidden"
    >
      {ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] tracking-[0.04em] no-underline ${
              active ? "text-rose" : "text-muted"
            }`}
          >
            <span className="size-[22px]">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
