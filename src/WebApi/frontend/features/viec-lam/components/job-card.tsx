"use client";

import { MapPin, Clock, Users, Flame, Bookmark, Building2, Home, Laptop } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { toast } from "sonner";
import type { Job } from "../types";

interface JobCardProps {
  job: Job;
}

/* Level pills — 3 calm groups instead of rainbow */
const levelStyles: Record<string, string> = {
  Intern: "bg-teal/10 text-primary",
  Fresher: "bg-teal/10 text-primary",
  Junior: "bg-teal/10 text-primary",
  Mid: "bg-mist/20 text-primary",
  Senior: "bg-navy text-white",
  Lead: "bg-navy text-white",
  Manager: "bg-sand/25 text-foreground",
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
    <Card className="group cursor-pointer rounded-[1.5rem] border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-marine/25 hover:shadow-[0_18px_44px_rgba(53,92,140,0.10)]">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-muted font-mono text-sm font-bold text-primary">
            {job.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate text-lg tracking-[-0.01em] group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <p className="mt-0.5 truncate text-[13px] font-medium text-muted-foreground">{job.company}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {job.isHot && (
                  <Badge className="gap-1 border-0 bg-sand font-bold text-foreground">
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
                    "flex size-9 items-center justify-center rounded-full border transition",
                    bookmarked
                      ? "border-navy bg-navy text-white shadow-sm"
                      : "border-border bg-card text-mist hover:border-marine/40 hover:text-primary hover:bg-muted"
                  )}
                >
                  <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4">
              <span className="rounded-full bg-teal/15 px-3 py-1.5 text-[13px] font-bold text-primary">{job.salary}</span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <workMode.icon className="h-3 w-3 text-teal" />
                {workMode.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3.5">
              <Badge className={cn("border-0 text-xs font-semibold", levelStyles[job.level] ?? "bg-mist/20 text-primary")}>
                {job.level}
              </Badge>
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                {job.employmentType}
              </Badge>
              {job.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs border-border text-muted-foreground">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 3 && (
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                  +{job.skills.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-mist" />
                {job.postedAt}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-mist" />
                {job.applicants} ứng viên
              </span>
              {bookmarked && (
                <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary">
                  <Bookmark className="h-3 w-3 fill-marine" /> Đã lưu
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
