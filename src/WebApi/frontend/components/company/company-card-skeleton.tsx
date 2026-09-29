import { Skeleton } from "@/components/ui/skeleton";

export function CompanyCardSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={`rounded-2xl border border-border bg-card p-5 ${compact ? "" : "min-h-56"}`}><Skeleton className="size-12 rounded-xl" /><Skeleton className="mt-4 h-5 w-3/5" /><Skeleton className="mt-2 h-4 w-2/5" /><Skeleton className="mt-6 h-4 w-full" /><Skeleton className="mt-2 h-4 w-4/5" /><Skeleton className="mt-6 h-9 w-full rounded-lg" /></div>;
}
