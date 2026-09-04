"use client";

import Link from "next/link";
import { Bookmark, Briefcase, ArrowRight } from "lucide-react";
import { JobCard } from "../job-card";
import { mockJobs } from "../mock-jobs";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DaLuuPage() {
  const { bookmarkedIds, count } = useBookmarks();
  const savedJobs = mockJobs.filter((job) => bookmarkedIds.has(job.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
          <Bookmark className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Việc làm đã lưu</h1>
          <p className="text-sm text-muted-foreground">
            {count > 0 ? `Bạn đã lưu ${count} việc làm • Xem lại mà không cần mở chi tiết` : "Bấm bookmark trên thẻ việc làm để lưu nhanh"}
          </p>
        </div>
        <Link href="/viec-lam" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto")}>
          Tìm việc làm <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {savedJobs.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Hiển thị <span className="font-medium text-foreground">{savedJobs.length}</span> việc đã lưu
          </p>
          <div className="grid gap-4">
            {savedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Bookmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Chưa có việc làm nào được lưu</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Khi duyệt việc làm ở trang chủ hay danh sách việc làm, bấm biểu tượng <Bookmark className="mb-0.5 inline h-3.5 w-3.5" /> để lưu tin nhanh. Việc đã lưu sẽ xuất hiện tại đây và đồng bộ trên mọi thiết bị qua localStorage.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/viec-lam" className={cn(buttonVariants({ variant: "default" }))}>
              <Briefcase className="mr-2 h-4 w-4" /> Khám phá việc làm
            </Link>
            <Link href="/#jobs" className={cn(buttonVariants({ variant: "outline" }))}>
              Xem việc nổi bật
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
