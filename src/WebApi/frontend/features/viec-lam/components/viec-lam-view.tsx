"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, Briefcase, ArrowRight, RefreshCw } from "lucide-react";
import { JobCard, JobCardSkeleton } from "./job-card";
import { JobFiltersBar } from "./job-filters";
import type { Job, JobFilters } from "../types";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { jobsApi } from "@/lib/api/jobs-api";
import { Pagination } from "@/components/ui/pagination";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 10;

const initialFilters: JobFilters = {
  keyword: "",
  location: "",
  level: "",
  employmentType: "",
  salaryMin: undefined,
  salaryMax: undefined,
  workMode: undefined,
};

function numParam(v: string | null): number | undefined {
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function useJobs(filters: JobFilters, page: number) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const filtersKey = useMemo(
    () =>
      JSON.stringify([
        filters.keyword,
        filters.location,
        filters.level,
        filters.employmentType,
        filters.salaryMin ?? "",
        filters.salaryMax ?? "",
        filters.workMode ?? "",
      ]),
    [filters]
  );

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      try {
        if (append) setLoadingMore(true);
        else {
          setLoading(true);
          setError("");
        }
        const res = await jobsApi.getJobs(filters, targetPage, PAGE_SIZE);
        setJobs((prev) => (append ? [...prev, ...res.jobs] : res.jobs));
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
        setHasNext(res.hasNext);
      } catch (cause) {
        if (!append) setError(cause instanceof Error ? cause.message : "Không tải được danh sách việc làm.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    // Data loading is intentionally triggered by the filter/page synchronization effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(page, page > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, page]);

  const reload = useCallback(() => void load(page, false), [load, page]);

  return { jobs, totalCount, totalPages, hasNext, loading, loadingMore, error, reload };
}

function ViecLamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { bookmarkedIds, count: savedCount } = useBookmarks();
  const [showSavedOnly, setShowSavedOnly] = useState(() => searchParams.get("saved") === "1");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<JobFilters>(() => ({
    keyword: searchParams.get("keyword") ?? "",
    location: searchParams.get("location") ?? "",
    level: searchParams.get("level") ?? "",
    employmentType: searchParams.get("employmentType") ?? "",
    salaryMin: numParam(searchParams.get("salaryMin")),
    salaryMax: numParam(searchParams.get("salaryMax")),
    workMode: searchParams.get("workMode") ?? undefined,
  }));
  const [previewJob, setPreviewJob] = useState<Job | null>(null);

  const debouncedKeyword = useDebouncedValue(filters.keyword, 400);
  const serverFilters = useMemo(
    () => ({ ...filters, keyword: debouncedKeyword }),
    [filters, debouncedKeyword]
  );

  const { jobs, totalCount, totalPages, loading, loadingMore, error, reload } = useJobs(
    serverFilters,
    page
  );

  const handleFilterChange = useCallback((next: JobFilters) => {
    setFilters(next);
    setPage(1);
  }, []);

  const visibleJobs = useMemo(
    () => (showSavedOnly ? jobs.filter((job) => bookmarkedIds.has(job.id)) : jobs),
    [jobs, showSavedOnly, bookmarkedIds]
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <Briefcase className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Tìm Việc Làm</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Khám phá cơ hội nghề nghiệp phù hợp với bạn
              {savedCount > 0 && !showSavedOnly && ` • Đã lưu ${savedCount} việc`}
            </p>
          </div>
        </div>
        <Button
          variant={showSavedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowSavedOnly((v) => !v)}
          className="gap-1.5 shrink-0 rounded-full"
        >
          <Bookmark className={cn("h-4 w-4", showSavedOnly && "fill-current")} />
          {showSavedOnly ? `Đã lưu (${savedCount})` : `Việc đã lưu${savedCount ? ` (${savedCount})` : ""}`}
        </Button>
      </div>

      <JobFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        totalJobs={showSavedOnly ? visibleJobs.length : totalCount}
      />
      <p className="text-xs text-muted-foreground">Bấm vào một tin để xem chi tiết và chọn CV ứng tuyển.</p>

      {showSavedOnly && (
        <div className="flex items-center justify-between rounded-2xl border border-sand/50 bg-sandsoft px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Bookmark className="h-4 w-4 fill-sand text-sand" /> Chỉ hiển thị việc đã lưu ({visibleJobs.length})
          </span>
          <button
            type="button"
            onClick={() => setShowSavedOnly(false)}
            className="text-xs font-semibold text-primary underline underline-offset-4 hover:text-primary"
          >
            Xem tất cả
          </button>
        </div>
      )}

      <div className="grid gap-5 sm:gap-6">
        {loading && jobs.length === 0 ? (
          <>
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-destructive/30 bg-card px-6 py-16 text-center">
            <p className="text-sm font-semibold text-foreground">Không tải được danh sách việc làm</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-5 rounded-full" onClick={() => void reload()}>
              <RefreshCw className="mr-2 size-4" /> Thử lại
            </Button>
          </div>
        ) : visibleJobs.length > 0 ? (
           visibleJobs.map((job) => <JobCard key={job.id} job={job} onPreview={setPreviewJob} />)
        ) : showSavedOnly ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border bg-card px-6 py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-sandsoft">
              <Bookmark className="size-7 text-bronze" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">Chưa có việc làm đã lưu</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground max-w-md">
              Bấm biểu tượng bookmark trên thẻ việc làm để lưu và xem lại sau mà không cần mở chi tiết.
            </p>
            <Button variant="outline" size="sm" className="mt-6 rounded-full" onClick={() => setShowSavedOnly(false)}>
              Xem tất cả việc làm
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border bg-card px-6 py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Briefcase className="size-7 text-primary" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">Không tìm thấy việc làm</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground max-w-md">
              Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm nhiều cơ hội hơn
            </p>
          </div>
        )}
        {loadingMore && (
          <>
            <JobCardSkeleton />
            <JobCardSkeleton />
          </>
        )}
      </div>

      {!showSavedOnly && !loading && !error && jobs.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Trang {page}/{totalPages} • Tổng {totalCount} tin
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Sheet open={Boolean(previewJob)} onOpenChange={(open) => !open && setPreviewJob(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {previewJob && <><SheetHeader><div className="flex size-12 items-center justify-center rounded-2xl bg-muted font-mono font-bold text-primary">{previewJob.logo}</div><SheetTitle className="pt-2">{previewJob.title}</SheetTitle><SheetDescription>{previewJob.company} • {previewJob.location}</SheetDescription></SheetHeader><div className="space-y-5 px-4 pb-8"><div className="flex flex-wrap gap-2"><Badge>{previewJob.salary}</Badge><Badge variant="outline">{previewJob.level}</Badge><Badge variant="outline">{previewJob.employmentType}</Badge></div><div><h3 className="mb-2 font-semibold">Mô tả công việc</h3><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{previewJob.description || "Nhà tuyển dụng chưa cập nhật mô tả."}</p></div><div><h3 className="mb-2 font-semibold">Kỹ năng</h3><div className="flex flex-wrap gap-2">{previewJob.skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></div><Button className="w-full rounded-xl" onClick={() => router.push(`/viec-lam/${previewJob.id}`)}>Xem chi tiết và ứng tuyển</Button></div></>}
        </SheetContent>
      </Sheet>

      {visibleJobs.length > 0 && (
        <p className="rounded-2xl border border-border bg-card px-4 py-3 text-center text-xs leading-5 text-muted-foreground">
          Mẹo: bấm <Bookmark className="mb-0.5 inline h-3 w-3" /> trên bất kỳ thẻ nào để lưu nhanh — không cần mở chi tiết.
        </p>
      )}
    </div>
  );
}

export function ViecLamView() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Đang tải bộ lọc...</div>}>
      <ViecLamContent />
    </Suspense>
  );
}

function DaLuuContent() {
  const { bookmarkedIds, count } = useBookmarks();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      // Lấy đủ rộng để lọc saved client-side (bookmark lưu local).
      const res = await jobsApi.getJobs(initialFilters, 1, 100);
      setJobs(res.jobs);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được danh sách việc làm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Saved jobs are hydrated from the browser-backed API after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const savedJobs = jobs.filter((job) => bookmarkedIds.has(job.id));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center gap-3.5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sandsoft">
          <Bookmark className="size-5 text-bronze" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Việc làm đã lưu</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {count > 0 ? `Bạn đã lưu ${count} việc làm • Xem lại mà không cần mở chi tiết` : "Bấm bookmark trên thẻ việc làm để lưu nhanh"}
          </p>
        </div>
        <Link href="/viec-lam" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto shrink-0 rounded-full")}>
          Tìm việc làm <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:gap-6">
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-destructive/30 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => void load()}>
            <RefreshCw className="mr-2 size-4" /> Thử lại
          </Button>
        </div>
      ) : savedJobs.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Hiển thị <span className="font-semibold text-primary">{savedJobs.length}</span> việc đã lưu
          </p>
          <div className="grid gap-5 sm:gap-6">
            {savedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-card px-6 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-sandsoft">
            <Bookmark className="size-7 text-bronze" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Chưa có việc làm nào được lưu</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Khi duyệt việc làm ở trang chủ hay danh sách việc làm, bấm biểu tượng <Bookmark className="mb-0.5 inline h-3.5 w-3.5" /> để lưu tin nhanh. Việc đã lưu sẽ xuất hiện tại đây và được giữ trên trình duyệt này.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/viec-lam" className={cn(buttonVariants({ variant: "default" }), "rounded-full")}>
              <Briefcase className="mr-2 h-4 w-4" /> Khám phá việc làm
            </Link>
            <Link href="/#jobs" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
              Xem việc nổi bật
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function DaLuuView() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Đang tải...</div>}>
      <DaLuuContent />
    </Suspense>
  );
}
