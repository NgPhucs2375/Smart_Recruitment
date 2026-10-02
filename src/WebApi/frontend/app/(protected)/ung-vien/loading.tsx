import { Skeleton } from "@/components/ui/skeleton";

export default function UngVienLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải hộp thư ứng viên">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-3.5 w-80" /></div>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div className="space-y-2"><Skeleton className="h-5 w-36" /><Skeleton className="h-3.5 w-64" /></div>
          <div className="flex gap-2"><Skeleton className="h-9 w-44 rounded-lg" /><Skeleton className="h-9 w-64 rounded-lg" /></div>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 p-5">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3.5 w-1/4" /></div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
