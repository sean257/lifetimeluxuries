export function SiteFooter() {
  return (
    <footer className="border-t border-line py-9 text-[13px] text-muted">
      <div className="wrap flex flex-wrap items-center justify-between gap-6">
        <span>
          © {new Date().getFullYear()} Lifetime Luxuries · Prices in US dollars · Orders are confirmed on WhatsApp
          before payment
        </span>
      </div>
    </footer>
  );
}
