export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className ?? ""}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-[20px] border border-line bg-white p-5" aria-hidden>
      <div className="flex items-start justify-between">
        <Skeleton className="h-24 w-full rounded-[16px]" />
      </div>
      <Skeleton className="mt-4 h-5 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-5 h-6 w-20 rounded-full" />
    </div>
  );
}

export function GridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Chargement">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="rounded-[20px] border border-line bg-white p-5" aria-hidden>
      <Skeleton className="h-8 w-8 rounded-[10px]" />
      <Skeleton className="mt-5 h-3 w-20" />
      <Skeleton className="mt-2 h-7 w-14" />
    </div>
  );
}
