import { Bone } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div aria-busy="true" className="grid gap-7">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div className="grid gap-2">
        <Bone className="h-3 w-32" />
        <Bone className="h-10 w-64" />
      </div>
      <Bone className="h-24" />
      <div className="grid gap-px border border-line bg-line">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 bg-surface px-4 py-3">
            <Bone className="size-10 flex-none" />
            <Bone className="h-4 flex-1" />
            <Bone className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
