/** Grey placeholder shown while products are loading. */
export default function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white" aria-hidden="true">
      <div className="aspect-square animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="flex justify-between pt-2">
          <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="h-6 w-1/4 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
