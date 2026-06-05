interface LoadingSkeletonProps {
  rows?: number;
}

function SkeletonRow() {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-zinc-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between gap-2">
            <div className="h-4 bg-zinc-200 rounded w-1/3" />
            <div className="h-3 bg-zinc-200 rounded w-12" />
          </div>
          <div className="h-3 bg-zinc-200 rounded w-2/3" />
          <div className="h-3 bg-zinc-200 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3" aria-label="Loading emails" aria-live="polite" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function DraftSkeleton() {
  return (
    <div className="animate-pulse space-y-2 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
      <div className="h-4 bg-zinc-200 rounded w-full" />
      <div className="h-4 bg-zinc-200 rounded w-5/6" />
      <div className="h-4 bg-zinc-200 rounded w-full" />
      <div className="h-4 bg-zinc-200 rounded w-4/6" />
      <div className="h-4 bg-zinc-200 rounded w-full" />
      <div className="h-4 bg-zinc-200 rounded w-3/4" />
      <p className="text-xs text-violet-500 font-medium pt-2">✨ Generating your reply…</p>
    </div>
  );
}
