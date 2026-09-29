import type { LucideIcon } from "lucide-react";
import { Bot, BriefcaseBusiness, Building2, CircleCheckBig, Clock3, FileText, Send, Users } from "lucide-react";
import type { MetricItem } from "../types/dashboard";

const icons: Record<string, LucideIcon> = {
  users: Users,
  companies: Building2,
  jobs: BriefcaseBusiness,
  applications: Send,
  cvs: FileText,
  "ai-cvs": Bot,
  "active-jobs": CircleCheckBig,
  "pending-jobs": Clock3,
};

export function MetricCard({ metric }: { metric: MetricItem }) {
  const Icon = icons[metric.Key] ?? FileText;
  const isPositive = metric.ChangePercent != null && metric.ChangePercent >= 0;
  return (
    <article className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/35 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">{metric.Label}</p>
        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl">
        {metric.Value.toLocaleString("vi-VN")}
      </p>
      <p className="mt-1.5 min-h-5 text-xs text-muted-foreground">
        {metric.ChangePercent == null ? "Chưa đủ kỳ trước để so sánh" : (
          <span className={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
            {isPositive ? "+" : ""}{metric.ChangePercent}% so với kỳ trước
          </span>
        )}
      </p>
    </article>
  );
}
