"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Clock,
  Home,
  Laptop,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MatchBreakdown, type MatchBreakdownData } from "@/components/jobs/match-breakdown";
import { formatSalaryFull } from "@/features/viec-lam/salary";
import { cn } from "@/lib/utils";

export type RecommendationItem = MatchBreakdownData & {
  tinTuyenDungId: number;
  tieuDe: string;
  tenDoanhNghiep: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  workMode: string;
  level: string;
  employmentType: string;
  created: string;
  soLuongUngVien: number;
  kyNangs: string[];
  kyNangThoa: string[];
  kyNangThieu: string[];
  kyNangBatBuocThieu: string[];
  ngayHetHan?: string;
  lyDoGoiY?: string;
};

const workModeMeta: Record<string, { label: string; icon: typeof Building2 }> = {
  Onsite: { label: "Tại văn phòng", icon: Building2 },
  Remote: { label: "Remote", icon: Home },
  Hybrid: { label: "Hybrid", icon: Laptop },
  Flexible: { label: "Linh hoạt", icon: SlidersHorizontal },
};

const levelStyles: Record<string, string> = {
  Intern: "bg-teal/10 text-primary",
  Fresher: "bg-teal/10 text-primary",
  Junior: "bg-teal/10 text-primary",
  Mid: "bg-mist/20 text-primary",
  Senior: "bg-navy text-white",
  Lead: "bg-navy text-white",
  Manager: "bg-sand/25 text-foreground",
};

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : name.trim().slice(0, 2)).toUpperCase() || "CT";
}

function postedAgo(value: string): string {
  const ts = new Date(value).getTime();
  if (!value || Number.isNaN(ts)) return "Mới đăng";
  const days = Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
}

function daysLeft(value?: string): number | null {
  if (!value) return null;
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.ceil((ts - Date.now()) / 86_400_000);
}

export function MatchedJobCard({ item }: { item: RecommendationItem }) {
  const pct = Math.round(item.diemPhuHop * 100);
  const mode = workModeMeta[item.workMode] ?? workModeMeta.Onsite;
  const ModeIcon = mode.icon;
  const salary = formatSalaryFull(item.luongToiThieu, item.luongToiDa);
  const required = item.kyNangs.length > 0
    ? item.kyNangs
    : Array.from(new Set([...item.kyNangThoa, ...item.kyNangThieu]));
  const optionalMissing = item.kyNangThieu.filter((s) => !item.kyNangBatBuocThieu.includes(s));
  const remaining = daysLeft(item.ngayHetHan);

  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-marine/25 hover:shadow-[0_18px_44px_rgba(53,92,140,0.10)]">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted font-mono text-sm font-bold text-primary" aria-hidden>
          {companyInitials(item.tenDoanhNghiep)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-[-0.01em] text-foreground">
                <Link
                  href={`/viec-lam/${item.tinTuyenDungId}`}
                  className="rounded-sm outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {item.tieuDe}
                </Link>
              </h3>
              <p className="mt-0.5 truncate text-[13px] font-medium text-muted-foreground">
                {item.tenDoanhNghiep || "Doanh nghiệp chưa cập nhật"}
              </p>
            </div>
            <span
              title="Điểm phù hợp với CV đang xét"
              className={cn(
                "shrink-0 rounded-full bg-gradient-to-r px-2.5 py-1 text-xs font-semibold text-white",
                pct >= 66 ? "from-[#355C8C] to-emerald-300" : "from-[#355C8C] to-sky-300",
              )}
            >
              {pct}% phù hợp
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-teal/15 px-3 py-1 text-[13px] font-bold text-primary">{salary}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 text-primary" />
              {item.diaDiemLamViec || "Linh hoạt"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <ModeIcon className="size-3 text-teal" />
              {mode.label}
            </span>
            {remaining !== null && remaining >= 0 && remaining <= 7 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
                <CalendarClock className="size-3" />
                {remaining === 0 ? "Hạn cuối hôm nay" : `Còn ${remaining} ngày`}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.level && (
              <Badge className={cn("border-0 text-xs font-semibold", levelStyles[item.level] ?? "bg-mist/20 text-primary")}>
                {item.level}
              </Badge>
            )}
            {item.employmentType && (
              <Badge variant="outline" className="border-border text-xs text-muted-foreground">{item.employmentType}</Badge>
            )}
            {required.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="border-border text-xs text-muted-foreground">{skill}</Badge>
            ))}
            {required.length > 3 && (
              <Badge variant="outline" className="border-border text-xs text-muted-foreground" title={required.slice(3).join(", ")}>
                +{required.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Khớp {item.kyNangThoa.length}/{required.length} kỹ năng</span>
          {item.kyNangBatBuocThieu.length === 0 ? (
            <span className="ml-2 font-medium text-emerald-700">Đủ kỹ năng bắt buộc</span>
          ) : (
            <span className="ml-2 font-medium text-red-600">Thiếu {item.kyNangBatBuocThieu.length} kỹ năng bắt buộc</span>
          )}
        </p>
        {(item.kyNangThoa.length > 0 || optionalMissing.length > 0 || item.kyNangBatBuocThieu.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {item.kyNangThoa.slice(0, 5).map((s) => (
              <span key={s} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700">{s}</span>
            ))}
            {item.kyNangBatBuocThieu.map((s) => (
              <span key={s} className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700">Thiếu bắt buộc: {s}</span>
            ))}
            {optionalMissing.slice(0, 3).map((s) => (
              <span key={s} className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">Thiếu: {s}</span>
            ))}
            {optionalMissing.length > 3 && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700" title={optionalMissing.slice(3).join(", ")}>
                +{optionalMissing.length - 3}
              </span>
            )}
          </div>
        )}
        {item.lyDoGoiY && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-workspace-ai" />
            {item.lyDoGoiY}
          </p>
        )}
        <MatchBreakdown data={item} showSkills={false} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-mist" />
            {postedAgo(item.created)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-mist" />
            {item.soLuongUngVien} ứng viên
          </span>
        </div>
        <Link
          href={`/viec-lam/${item.tinTuyenDungId}`}
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary/50"
        >
          Xem chi tiết <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
