"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bookmark, Briefcase } from "lucide-react";
import { JobCard } from "./job-card";
import { JobFiltersBar } from "./job-filters";
import { mockJobs } from "./mock-jobs";
import type { JobFilters } from "./types";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tìm Việc Làm</h1>
            <p className="text-sm text-muted-foreground">
              Khám phá cơ hội nghề nghiệp phù hợp với bạn
              {savedCount > 0 && !showSavedOnly && ` • Đã lưu ${savedCount} việc`}
            </p>
          </div>
        </div>
        <Button
          variant={showSavedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowSavedOnly((v) => !v)}
          className="gap-1.5 shrink-0"
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
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm dark:border-amber-900/40 dark:bg-amber-950/30">
          <span className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <Bookmark className="h-4 w-4 fill-amber-600 text-amber-600" /> Chỉ hiển thị việc đã lưu ({filteredJobs.length})
          </span>
          <button
            type="button"
            onClick={() => setShowSavedOnly(false)}
            className="text-xs font-medium text-amber-900 underline underline-offset-4 hover:text-amber-700 dark:text-amber-200"
          >
            Xem tất cả
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : showSavedOnly ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Chưa có việc làm đã lưu</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Bấm biểu tượng bookmark trên thẻ việc làm để lưu và xem lại sau mà không cần mở chi tiết.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowSavedOnly(false)}>
              Xem tất cả việc làm
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Không tìm thấy việc làm</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm nhiều cơ hội hơn
            </p>
          </div>
        )}
      </div>

      {filteredJobs.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Mẹo: bấm <Bookmark className="mb-0.5 inline h-3 w-3" /> trên bất kỳ thẻ nào để lưu nhanh — không cần mở chi tiết.
        </p>
      )}
    </div>
  );
}

export default function ViecLamPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Đang tải bộ lọc...</div>}>
      <ViecLamContent />
    </Suspense>
  );
}
