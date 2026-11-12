"use client";
import { useEffect, useState } from "react";
import { THEME_COLOR, THEME_KEY, type Theme } from "@/lib/theme";

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  for (const m of Array.from(document.querySelectorAll('meta[name="theme-color"]'))) {
    m.setAttribute("content", THEME_COLOR[theme]);
  }
}

/** Sun/moon switch. Follows the device until the visitor chooses; the choice is remembered on this device. */
export function ThemeToggle({ className = "size-10" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(currentTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!document.documentElement.dataset.theme) setTheme(currentTheme());
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next);
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          // Private mode: the choice lasts for this page only.
        }
        setTheme(next);
      }}
      aria-label={theme ? `Switch to ${next} mode` : "Switch colour theme"}
      title={theme ? `Switch to ${next} mode` : undefined}
      className={`grid flex-none place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`size-[18px] ${theme ? "" : "invisible"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  );
}
