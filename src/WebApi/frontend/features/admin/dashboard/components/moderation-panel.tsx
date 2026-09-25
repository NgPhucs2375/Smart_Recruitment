import { AlertTriangle, Building2, LockKeyhole, ShieldCheck } from "lucide-react";
import type { AdminDashboardData } from "../types/dashboard";

export function ModerationPanel({ moderation }: { moderation: AdminDashboardData["Moderation"] }) {
  const items = [
    { label: "Chờ admin duyệt", value: moderation.AdminPending, icon: AlertTriangle },
    { label: "Hệ thống đang duyệt", value: moderation.SystemPending, icon: ShieldCheck },
    { label: "Chờ người đại diện", value: moderation.RepresentativePending, icon: Building2 },
    { label: "Tin bị khóa", value: moderation.LockedJobs, icon: LockKeyhole },
  ];
  return <div className="grid gap-2">{items.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3"><span className="grid size-9 place-items-center rounded-lg bg-background text-primary"><Icon className="size-4" /></span><span className="min-w-0 flex-1 text-sm text-muted-foreground">{label}</span><strong className="tabular-nums">{value.toLocaleString("vi-VN")}</strong></div>)}</div>;
}
