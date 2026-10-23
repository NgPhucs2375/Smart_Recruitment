"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard, JobCardSkeleton } from "./job-card";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { jobsApi } from "@/lib/api/jobs-api";
import type { Job, JobFilters } from "../types";

// Lấy đủ rộng (100 tin) rồi lọc theo bookmark phía client — bookmark lưu local.
const EMPTY_FILTERS = {
  keyword: "",
  location: "",
  level: "",
  employmentType: "",
  salaryMin: undefined,
  salaryMax: undefined,
  workMode: undefined,
} satisfies JobFilters;

/** Tab "Đã lưu": danh sách việc đã đánh dấu + empty state theo wireframe. */
export function SavedJobsPanel({ onExplore }: { onExplore: () => void }) {
  const { bookmarkedIds } = useBookmarks();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await jobsApi.getJobs(EMPTY_FILTERS, 1, 100);
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
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Việc làm đã lưu{" "}
        <span className="tabular-nums normal-case tracking-normal text-foreground">
          ({loading ? "…" : savedJobs.length})
        </span>
      </h2>

      {loading ? (
        <div className="grid gap-5 sm:gap-6">
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => void load()}>
            <RefreshCw className="mr-2 size-4" /> Thử lại
          </Button>
        </div>
      ) : savedJobs.length > 0 ? (
        <div className="grid gap-5 sm:gap-6">
          {savedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-sandsoft">
            <Bookmark className="size-6 text-bronze" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">Chưa có việc làm đã lưu</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Bấm biểu tượng đánh dấu (Bookmark) trên mỗi tin tuyển dụng để lưu lại và ứng tuyển sau trên mọi thiết bị.
          </p>
          <Button variant="outline" size="sm" className="mt-5 rounded-full" onClick={onExplore}>
            Khám phá việc làm
          </Button>
        </div>
      )}
    </section>
  );
}
