import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải dashboard">
      <Skeleton className="h-4 w-40" />
      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex flex-col justify-between gap-6 p-6 sm:p-8">
          <div className="space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-64" /><Skeleton className="h-4 w-full max-w-md" /></div>
          <div className="flex gap-2"><Skeleton className="h-10 w-36 rounded-xl" /><Skeleton className="h-10 w-28 rounded-xl" /></div>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="border-border/80 shadow-sm">
            <CardContent className="p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-4 h-9 w-16" />
              <Skeleton className="mt-2 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
