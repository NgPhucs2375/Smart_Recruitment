"use client";

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, Briefcase, ArrowRight, RefreshCw, X } from "lucide-react";
import { JobCard, JobCardSkeleton } from "./job-card";
import { JobFiltersBar } from "./job-filters";
import type { Job, JobFilters } from "../types";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { RecommendationPreview } from "@/features/recommendations/recommendation-preview";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { jobsApi } from "@/lib/api/jobs-api";
import { Pagination } from "@/components/ui/pagination";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
  const { bookmarkedIds, count: savedCount, toggle: toggleBookmark, isBookmarked } = useBookmarks();
  const [showSavedOnly, setShowSavedOnly] = useState(() => searchParams.get("saved") === "1");
  const [page, setPage] = useState(() => {
    const parsed = Number(searchParams.get("page"));
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  });
  const [filters, setFilters] = useState<JobFilters>(() => {
    // Chuẩn hóa "?level=all" (link cũ) về "" để trigger không lọt raw value.
    const strParam = (v: string | null) => (!v || v === "all" ? "" : v);
    return {
      keyword: searchParams.get("keyword") ?? "",
      location: strParam(searchParams.get("location")),
      level: strParam(searchParams.get("level")),
      employmentType: strParam(searchParams.get("employmentType")),
      salaryMin: numParam(searchParams.get("salaryMin")),
      salaryMax: numParam(searchParams.get("salaryMax")),
      workMode: strParam(searchParams.get("workMode")) || undefined,
      categoryId: numParam(searchParams.get("categoryId")),
      skillIds: (searchParams.get("skillIds") ?? "").split(",").map(Number).filter(n => Number.isInteger(n) && n > 0),
      matchAllSkills: searchParams.get("matchAllSkills") === "1",
    };
  });
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

  // Ghi filter/page ngược vào URL (debounced theo keyword) để back/refresh
  // giữ nguyên bộ lọc — tránh reset khi bấm vào chi tiết rồi quay lại.
  const urlSynced = useRef(false);
  useEffect(() => {
    if (!urlSynced.current) {
      urlSynced.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (debouncedKeyword) params.set("keyword", debouncedKeyword);
    if (filters.location) params.set("location", filters.location);
    if (filters.level) params.set("level", filters.level);
    if (filters.employmentType) params.set("employmentType", filters.employmentType);
    if (filters.salaryMin !== undefined) params.set("salaryMin", String(filters.salaryMin));
    if (filters.salaryMax !== undefined) params.set("salaryMax", String(filters.salaryMax));
    if (filters.workMode) params.set("workMode", filters.workMode);
    if (filters.categoryId) params.set("categoryId", String(filters.categoryId));
    if (filters.skillIds?.length) params.set("skillIds", filters.skillIds.join(","));
    if (filters.matchAllSkills) params.set("matchAllSkills", "1");
    if (page > 1) params.set("page", String(page));
    if (showSavedOnly) params.set("saved", "1");
    const query = params.toString();
    router.replace(query ? `/viec-lam?${query}` : "/viec-lam", { scroll: false });
  }, [
    debouncedKeyword,
    filters.location,
    filters.level,
    filters.employmentType,
    filters.salaryMin,
    filters.salaryMax,
    filters.workMode,
    filters.categoryId,
    filters.skillIds,
    filters.matchAllSkills,
    page,
    showSavedOnly,
    router,
  ]);

  // Chuyển trang: cuộn về đầu danh sách thay vì ở vị trí cũ khi danh sách ghép trang.
  const handlePageChange = useCallback((next: number) => {
    setPage(next);
    requestAnimationFrame(() => {
      document.getElementById("viec-lam-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

      <RecommendationPreview count={3} />

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
            className="text-xs font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Xem tất cả
          </button>
        </div>
      )}

      <div id="viec-lam-results" className="grid gap-5 sm:gap-6">
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
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      <Sheet open={Boolean(previewJob)} onOpenChange={(open) => !open && setPreviewJob(null)}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full overflow-y-auto rounded-l-2xl p-6 sm:max-w-lg"
        >
          {previewJob && (
            <>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setPreviewJob(null)}
                className="absolute top-4 right-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>

              <SheetHeader className="p-0 pr-10">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#355C8C] to-[#5b8ec9] text-sm font-bold text-white shadow-sm">
                  {(previewJob.logo || previewJob.company.slice(0, 2) || "HR").toUpperCase()}
                </div>
                <SheetTitle className="pt-3 text-lg">{previewJob.title}</SheetTitle>
                <SheetDescription>
                  {previewJob.company} • {previewJob.location}
                </SheetDescription>
                <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 text-xs font-semibold text-[#355C8C]">
                  🎯 95% Match <span className="font-normal text-blue-500">(Phù hợp cao với hồ sơ)</span>
                </span>
              </SheetHeader>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {previewJob.salary}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {previewJob.level === "Mid" ? "Mid-level" : previewJob.level}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {previewJob.employmentType === "Full-time" ? "Toàn thời gian" : previewJob.employmentType} • {previewJob.workMode}
                  </span>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Mô tả công việc</h3>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {previewJob.description || "Nhà tuyển dụng chưa cập nhật mô tả."}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Yêu cầu chính</h3>
                  <ul className="space-y-2">
                    <li className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                      Tối thiểu 2 năm kinh nghiệm làm việc với dữ liệu
                    </li>
                    <li className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                      Thành thạo truy vấn cơ sở dữ liệu và trực quan hóa dashboard
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Kỹ năng</h3>
                  <div>
                    {(previewJob.skills.length > 0
                      ? previewJob.skills
                      : ["Python", "SQL", "Power BI", "Data Analysis", "ETL"]
                    ).map((skill) => (
                      <span
                        key={skill}
                        className="mr-2 mb-2 inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/viec-lam/${previewJob.id}`)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#355C8C] py-3 font-medium text-white transition-colors hover:bg-[#2d4f79] active:scale-[0.98]"
                  >
                    Xem chi tiết &amp; Ứng tuyển <ArrowRight className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(previewJob.id)}
                    aria-pressed={isBookmarked(previewJob.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      isBookmarked(previewJob.id)
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    <Bookmark className={`size-4 ${isBookmarked(previewJob.id) ? "fill-current" : ""}`} />
                    Lưu tin
                  </button>
                </div>
              </div>
            </>
          )}
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
