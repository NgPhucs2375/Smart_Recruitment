import { BriefcaseBusiness, Building2, FileText, Send } from "lucide-react";
import type { ActivityItem } from "../types/dashboard";

const icons = { job: BriefcaseBusiness, company: Building2, cv: FileText, application: Send };

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">Chưa có hoạt động.</p>;
  return <div className="divide-y divide-border">{items.map((item, index) => {
    const Icon = icons[item.Entity as keyof typeof icons] ?? FileText;
    return <div key={`${item.Entity}-${item.At}-${index}`} className="flex gap-3 py-3 first:pt-0 last:pb-0"><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.Description}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.Type} · {new Date(item.At).toLocaleString("vi-VN")}</p></div></div>;
  })}</div>;
}
