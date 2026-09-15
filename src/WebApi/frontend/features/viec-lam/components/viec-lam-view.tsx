"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bookmark, Briefcase, ArrowRight } from "lucide-react";
import { JobCard } from "./job-card";
import { JobFiltersBar } from "./job-filters";
import { mockJobs } from "../mock-jobs";
import type { JobFilters } from "../types";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialFilters: JobFilters = {
  keyword: "",
  location: "",
  level: "",
  employmentType: "",
  salary: "",
};

function ViecLamContent() {
  const searchParams = useSearchParams();
  const { bookmarkedIds, count: savedCount } = useBookmarks();
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [filters, setFilters] = useState<JobFilters>(() => {
    const keyword = searchParams.get("keyword") ?? "";
    const location = searchParams.get("location") ?? "";
    const level = searchParams.get("level") ?? "";
    const employmentType = searchParams.get("employmentType") ?? "";
    const salary = searchParams.get("salary") ?? "";
    if (keyword || location || level || employmentType || salary) {
      return { keyword, location, level, employmentType, salary };
    }
    return initialFilters;
  });

  useEffect(() => {
    const keyword = searchParams.get("keyword") ?? "";
    const location = searchParams.get("location") ?? "";
    const level = searchParams.get("level") ?? "";
    const employmentType = searchParams.get("employmentType") ?? "";
    const salary = searchParams.get("salary") ?? "";
    if (keyword || location || level || employmentType || salary) {
      setFilters({ keyword, location, level, employmentType, salary });
    }
    if (searchParams.get("saved") === "1") setShowSavedOnly(true);
  }, [searchParams]);

  const filteredJobs = useMemo(() => {
    let result = mockJobs.filter((job) => {
      if (filters.keyword) {
        const q = filters.keyword.toLowerCase();
        const match =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.skills.some((s) => s.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filters.location && job.location !== filters.location) return false;
      if (filters.level && job.level !== filters.level) return false;
      if (filters.employmentType && job.employmentType !== filters.employmentType) return false;
      if (filters.salary) {
        const salaryNum = parseInt(job.salary.replace(/[^0-9]/g, ""));
        if (filters.salary === "Dưới 10 triệu" && salaryNum >= 10) return false;
        if (filters.salary === "10 - 20 triệu" && (salaryNum < 10 || salaryNum > 20)) return false;
        if (filters.salary === "20 - 30 triệu" && (salaryNum < 20 || salaryNum > 30)) return false;
        if (filters.salary === "30 - 50 triệu" && (salaryNum < 30 || salaryNum > 50)) return false;
        if (filters.salary === "Trên 50 triệu" && salaryNum <= 50) return false;
      }
      return true;
    });
    if (showSavedOnly) {
      result = result.filter((job) => bookmarkedIds.has(job.id));
    }
    return result;
  }, [filters, showSavedOnly, bookmarkedIds]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-frost">
            <Briefcase className="size-5 text-marine" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-charcoal sm:text-[28px]">Tìm Việc Làm</h1>
            <p className="mt-0.5 text-sm text-charcoal/60">
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
        onFilterChange={setFilters}
        totalJobs={filteredJobs.length}
      />

      {showSavedOnly && (
        <div className="flex items-center justify-between rounded-2xl border border-sand/50 bg-sandsoft px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-medium text-charcoal">
            <Bookmark className="h-4 w-4 fill-sand text-sand" /> Chỉ hiển thị việc đã lưu ({filteredJobs.length})
          </span>
          <button
            type="button"
            onClick={() => setShowSavedOnly(false)}
            className="text-xs font-semibold text-marine underline underline-offset-4 hover:text-navy"
          >
            Xem tất cả
          </button>
        </div>
      )}

      <div className="grid gap-5 sm:gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : showSavedOnly ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-linen bg-card px-6 py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-sandsoft">
              <Bookmark className="size-7 text-bronze" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-charcoal">Chưa có việc làm đã lưu</h3>
            <p className="mt-2 text-sm leading-6 text-charcoal/60 max-w-md">
              Bấm biểu tượng bookmark trên thẻ việc làm để lưu và xem lại sau mà không cần mở chi tiết.
            </p>
            <Button variant="outline" size="sm" className="mt-6 rounded-full" onClick={() => setShowSavedOnly(false)}>
              Xem tất cả việc làm
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-linen bg-card px-6 py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-frost">
              <Briefcase className="size-7 text-marine" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-charcoal">Không tìm thấy việc làm</h3>
            <p className="mt-2 text-sm leading-6 text-charcoal/60 max-w-md">
              Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm nhiều cơ hội hơn
            </p>
          </div>
        )}
      </div>

      {filteredJobs.length > 0 && (
        <p className="rounded-2xl border border-linen bg-card px-4 py-3 text-center text-xs leading-5 text-charcoal/55">
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
  const savedJobs = mockJobs.filter((job) => bookmarkedIds.has(job.id));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
      <div className="flex items-center gap-3.5">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-sandsoft">
          <Bookmark className="size-5 text-bronze" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal sm:text-[28px]">Việc làm đã lưu</h1>
          <p className="mt-0.5 text-sm text-charcoal/60">
            {count > 0 ? `Bạn đã lưu ${count} việc làm • Xem lại mà không cần mở chi tiết` : "Bấm bookmark trên thẻ việc làm để lưu nhanh"}
          </p>
        </div>
        <Link href="/viec-lam" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto rounded-full")}>
          Tìm việc làm <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {savedJobs.length > 0 ? (
        <>
          <p className="text-sm text-charcoal/60">
            Hiển thị <span className="font-semibold text-navy">{savedJobs.length}</span> việc đã lưu
          </p>
          <div className="grid gap-5 sm:gap-6">
            {savedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-linen bg-card px-6 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-sandsoft">
            <Bookmark className="size-7 text-bronze" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-charcoal">Chưa có việc làm nào được lưu</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-charcoal/60">
            Khi duyệt việc làm ở trang chủ hay danh sách việc làm, bấm biểu tượng <Bookmark className="mb-0.5 inline h-3.5 w-3.5" /> để lưu tin nhanh. Việc đã lưu sẽ xuất hiện tại đây và đồng bộ trên mọi thiết bị qua localStorage.
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