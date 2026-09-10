"use client";

import { MapPin, Clock, Users, Flame, Bookmark, Building2, Home, Laptop } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { toast } from "sonner";
import type { Job } from "./types";

interface JobCardProps {
  job: Job;
}

const levelColors: Record<string, string> = {
  Intern: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Fresher: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Junior: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Mid: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Senior: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Lead: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Manager: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

const workModeConfig: Record<string, { label: string; icon: typeof Building2 }> = {
  Remote: { label: "Remote", icon: Home },
  Hybrid: { label: "Hybrid", icon: Laptop },
  Onsite: { label: "Onsite", icon: Building2 },
};

export function JobCard({ job }: JobCardProps) {
  const { isBookmarked, toggle } = useBookmarks();
  const bookmarked = isBookmarked(job.id);
  const workMode = workModeConfig[job.workMode] ?? workModeConfig.Onsite;

  function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(job.id);
    if (bookmarked) {
      toast.success("Đã bỏ lưu việc làm", { description: job.title });
    } else {
      toast.success("Đã lưu việc làm", { description: "Xem lại tại Việc làm đã lưu" });
    }
  }

  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
            {job.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">{job.company}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {job.isHot && (
                  <Badge variant="destructive" className="gap-1">
                    <Flame className="h-3 w-3" />
                    Hot
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={handleBookmark}
                  aria-label={bookmarked ? "Bỏ lưu" : "Lưu việc làm"}
                  aria-pressed={bookmarked}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border transition",
                    bookmarked
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{job.salary}</span>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <workMode.icon className="h-3 w-3" />
                {workMode.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <Badge variant="secondary" className={cn("text-xs", levelColors[job.level])}>
                {job.level}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {job.employmentType}
              </Badge>
              {job.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{job.skills.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {job.postedAt}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {job.applicants} ứng viên
              </span>
              {bookmarked && (
                <span className="ml-auto inline-flex items-center gap-1 text-primary font-medium">
                  <Bookmark className="h-3 w-3 fill-primary" /> Đã lưu
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
