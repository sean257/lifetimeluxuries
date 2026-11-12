export function Panel({
  title,
  sub,
  actions,
  children,
  className = "",
}: {
  title?: string;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 border border-line bg-surface px-4 py-5 min-[700px]:px-[22px] ${className}`}>
      {title || actions ? (
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
          <div>
            {title ? <h2 className="mb-1 text-2xl">{title}</h2> : null}
            {sub ? <p className="text-[13px] text-muted">{sub}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
