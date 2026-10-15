import { Skeleton } from "@/components/ui/skeleton";

export default function ViecLamLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8" aria-busy="true" aria-label="Đang tải danh sách việc làm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <Skeleton className="size-11 rounded-2xl" />
          <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-3.5 w-64" /></div>
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-5 sm:gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-[1.5rem] border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="size-13 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3.5 w-1/3" />
                <div className="flex gap-2"><Skeleton className="h-7 w-28 rounded-full" /><Skeleton className="h-7 w-24 rounded-full" /><Skeleton className="h-7 w-20 rounded-full" /></div>
                <div className="flex gap-1.5"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-14 rounded-full" /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
