import { Skeleton } from "@/components/ui/skeleton";

export default function TinTuyenDungLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải tin tuyển dụng">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2"><Skeleton className="h-6 w-56" /><Skeleton className="h-3.5 w-72" /></div>
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-64 rounded-lg" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2"><Skeleton className="h-5 w-2/5" /><Skeleton className="h-6 w-20" /></div>
                <Skeleton className="h-3.5 w-1/2" />
              </div>
              <div className="flex gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-16" /><Skeleton className="h-8 w-16" /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
