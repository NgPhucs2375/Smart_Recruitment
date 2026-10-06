import { Skeleton } from "@/components/ui/skeleton";
import { CompanyCardSkeleton } from "@/components/company/company-card-skeleton";

export default function DoanhNghiepLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-6 sm:px-6 sm:py-10" aria-busy="true" aria-label="Đang tải danh bạ doanh nghiệp">
      <section className="rounded-3xl bg-primary p-6 sm:p-9">
        <Skeleton className="h-4 w-36 bg-primary-foreground/20" />
        <Skeleton className="mt-4 h-9 w-72 bg-primary-foreground/20" />
        <Skeleton className="mt-3 h-4 w-full max-w-md bg-primary-foreground/20" />
        <div className="mt-7 flex flex-col gap-2 lg:flex-row">
          <Skeleton className="h-11 w-full max-w-md bg-primary-foreground/20" />
          <Skeleton className="h-11 w-64 bg-primary-foreground/20" />
        </div>
      </section>
      <section>
        <Skeleton className="mb-4 h-7 w-52" />
        <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <CompanyCardSkeleton key={item} />)}</div>
      </section>
    </main>
  );
}
