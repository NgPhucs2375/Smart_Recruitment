"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, ChevronDown, ChevronUp, Inbox, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Job } from "@/features/viec-lam/types";

const INITIAL_VISIBLE = 5;

export function CompanyJobList({ jobs, loading, matchScores }: { jobs: Job[]; loading: boolean; matchScores: Record<string, number> }) {
  const [location, setLocation] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const locations = useMemo(() => Array.from(new Set(jobs.map((job) => job.location).filter(Boolean))), [jobs]);
  const filtered = useMemo(
    () => (location === "all" ? jobs : jobs.filter((job) => job.location === location)),
    [jobs, location],
  );
  const visibleJobs = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = filtered.length - visibleJobs.length;
  const canCollapse = expanded && filtered.length > INITIAL_VISIBLE;
  const changeLocation = (value: string) => {
    setLocation(value);
    setExpanded(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><BriefcaseBusiness className="size-4 text-primary" />Việc làm đang tuyển</CardTitle>
        <CardAction><Badge variant="secondary">{filtered.length}</Badge></CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {locations.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc tin theo địa điểm">
            {["all", ...locations].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={location === value}
                onClick={() => changeLocation(value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${location === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {value === "all" ? "Tất cả" : value}
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải việc làm...</p>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
            <Inbox className="size-8 text-muted-foreground/60" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Doanh nghiệp hiện chưa có việc làm đang mở.</p>
            <p className="text-xs text-muted-foreground">Nhấn theo dõi để nhận tin ngay khi có vị trí mới.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Không có tin ở địa điểm này.{" "}
            <button type="button" className="font-medium text-primary underline underline-offset-4" onClick={() => changeLocation("all")}>
              Xem tất cả
            </button>
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {visibleJobs.map((job) => {
                const score = matchScores[job.id];
                return (
                  <Link key={job.id} href={`/viec-lam/${job.id}`} className="group block rounded-2xl border border-border p-4 transition-colors hover:border-primary/35 hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold group-hover:text-primary">{job.title}</h3>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{job.location}</span>
                          <span>{job.salary}</span>
                        </p>
                      </div>
                      {score != null && <Badge className="shrink-0 gap-1.5"><Sparkles className="size-3" />{Math.round(score)}% phù hợp</Badge>}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">{job.skills.slice(0, 4).map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </Link>
                );
              })}
            </div>
            {(hiddenCount > 0 || canCollapse) && (
              <button
                type="button"
                className="mx-auto flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                onClick={() => setExpanded((value) => !value)}
              >
                {canCollapse ? <>Thu gọn <ChevronUp className="size-3.5" aria-hidden="true" /></> : <>Xem thêm {hiddenCount} tin <ChevronDown className="size-3.5" aria-hidden="true" /></>}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
