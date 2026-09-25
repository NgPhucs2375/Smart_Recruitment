import { CircleCheck, CircleHelp, TriangleAlert } from "lucide-react";
import type { AdminDashboardData } from "../types/dashboard";

export function SystemHealth({ items }: { items: AdminDashboardData["Health"] }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => {
    const healthy = item.Status === "healthy";
    const Icon = !item.IsTracked ? CircleHelp : healthy ? CircleCheck : TriangleAlert;
    return <div key={item.Name} className="flex items-center gap-3 rounded-xl border border-border p-3.5"><Icon className={`size-5 ${!item.IsTracked ? "text-muted-foreground" : healthy ? "text-emerald-500" : "text-amber-500"}`} /><div><p className="text-sm font-medium">{item.Name}</p><p className="text-xs text-muted-foreground">{!item.IsTracked ? "Chưa có telemetry" : healthy ? "Hoạt động" : "Suy giảm"}</p></div></div>;
  })}</div>;
}
