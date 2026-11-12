import { Bone } from "@/components/skeleton";

export default function ShopLoading() {
  return (
    <main id="main" className="wrap pt-10 pb-[72px]" aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <Bone className="mb-3 h-3 w-28" />
      <Bone className="mb-6 h-9 w-56" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-x-[22px] gap-y-8">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="grid gap-2.5">
            <Bone className="aspect-[4/5]" />
            <Bone className="h-5 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
