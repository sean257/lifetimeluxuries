export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="eyebrow">Owner dashboard</div>
        <h1 className="text-[34px] min-[700px]:text-[40px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-[62ch] text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
