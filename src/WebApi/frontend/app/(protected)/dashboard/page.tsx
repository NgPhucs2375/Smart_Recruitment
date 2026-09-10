"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Send, Bookmark, ArrowUpRight, Sparkles, Building2, Clock, ChevronRight, TrendingUp, LayoutDashboard, Briefcase, Users } from "lucide-react";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { useStoredIdentity } from "@/hooks/use-stored-identity";

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };
type DonUngTuyen = { id: number; tinTuyenDungId: number; trangThai: number; ngayUngTuyen: string };
type KetQuaPhuHop = { id: number; tinTuyenDungId: number; diemPhuHop: number };

const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;
const extractArray = <T,>(r: ApiResponse<T>): unknown[] => {
  const d = extractData(r);
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") {
    const obj = d as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.Items)) return obj.Items;
  }
  return [];
};

const TRANG_THAI: Record<number, { label: string; color: string }> = {
  0: { label: "Khởi tạo", color: "text-muted-foreground bg-muted border-border" },
  2: { label: "Chờ xử lý", color: "text-blue-600 bg-blue-50 border-blue-200" },
  3: { label: "Đã xem", color: "text-blue-600 bg-blue-50 border-blue-200" },
  4: { label: "Phù hợp", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  5: { label: "Từ chối", color: "text-destructive bg-destructive/5 border-destructive/30" },
};

function fmtDate(d: string) {
  if (!d) return "";
  try {
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Hôm nay";
    if (days === 1) return "Hôm qua";
    if (days < 7) return `${days} ngày trước`;
    return new Date(d).toLocaleDateString("vi-VN");
  } catch { return d; }
}

export default function DashboardPage() {
  const identity = useStoredIdentity();
  const isCandidate = identity?.roles.some((r) => r.trim().toUpperCase() === "UNG_VIEN") ?? false;

  if (isCandidate) return <CandidateDashboard />;
  return <RecruiterAdminDashboard />;
}

/* ─── Candidate Dashboard ──────────────────────────────────────────────────── */

function CandidateDashboard() {
  const [appliedCount, setAppliedCount] = useState(0);
  const [recentApplied, setRecentApplied] = useState<DonUngTuyen[]>([]);
  const [profileName, setProfileName] = useState("bạn");
  const [matchCount, setMatchCount] = useState(0);

  const apiFetch = useCallback(async (url: string) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return body as ApiResponse<unknown> | null;
  }, []);

  useEffect(() => {
    void (async () => {
      const [donRes, hsRes, pqRes] = await Promise.all([
        apiFetch("/api/dotnet/donungtuyen"),
        apiFetch("/api/dotnet/hosoungviens"),
        apiFetch("/api/dotnet/ketquaphuhop"),
      ]);

      if (donRes && ok(donRes)) {
        const items = extractArray(donRes).map((v: unknown) => {
          const r = v as Record<string, unknown>;
          return { id: Number(r.id ?? r.Id), tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0), trangThai: Number(r.trangThai ?? r.TrangThai ?? 0), ngayUngTuyen: `${r.ngayUngTuyen ?? r.NgayUngTuyen ?? ""}` };
        }) as DonUngTuyen[];
        setAppliedCount(items.length);
        setRecentApplied(items.slice(0, 4));
      }

      if (hsRes && ok(hsRes)) {
        const items = extractArray(hsRes);
        if (items.length > 0) {
          const r = items[0] as Record<string, unknown>;
          setProfileName(`${r.hoTen ?? r.HoTen ?? "bạn"}`);
        }
      }

      if (pqRes && ok(pqRes)) {
        setMatchCount(extractArray(pqRes).length);
      }
    })();
  }, [apiFetch]);

  return (
    <AdminPageLayout>
      <div className="flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-8 shadow-sm md:flex-row md:items-center">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Candidate Hub</span>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Chào mừng trở lại, {profileName}!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hoàn thiện hồ sơ và CV để tăng cơ hội được nhà tuyển dụng chú ý.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/CV" className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            <FileText className="size-4" /> Quản lý CV
          </Link>
          <Link href="/viec-lam" className="flex items-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:border-foreground/40">
            Tìm việc ngay <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/CV" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-foreground/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider">CV đã tạo</span>
            <FileText className="size-5" />
          </div>
          <div className="mt-6 text-4xl font-semibold tracking-tight">—</div>
          <p className="mt-2 text-xs text-muted-foreground">Quản lý CV của bạn</p>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider">Việc đã ứng tuyển</span>
            <Send className="size-5" />
          </div>
          <div className="mt-6 text-4xl font-semibold tracking-tight">{appliedCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">{recentApplied.length} đơn gần đây</p>
        </div>

        <Link href="/viec-lam/phu-hop" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-foreground/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider">Việc phù hợp</span>
            <TrendingUp className="size-5" />
          </div>
          <div className="mt-6 text-4xl font-semibold tracking-tight">{matchCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">Kết quả AI gợi ý</p>
        </Link>

        <Link href="/viec-lam/da-luu" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-foreground/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider">Việc đã lưu</span>
            <Bookmark className="size-5" />
          </div>
          <div className="mt-6 text-4xl font-semibold tracking-tight">—</div>
          <p className="mt-2 text-xs text-muted-foreground">Xem lại sau</p>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div>
              <h2 className="text-xl font-medium tracking-tight">Đơn ứng tuyển gần đây</h2>
              <p className="mt-1 text-xs text-muted-foreground">Theo dõi tiến độ duyệt hồ sơ</p>
            </div>
            <Link href="/viec-lam/da-ung-tuyen" className="text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-70">
              Xem tất cả
            </Link>
          </div>

          {recentApplied.length === 0 ? (
            <div className="mt-8 text-center">
              <Send className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">Chưa có đơn ứng tuyển nào.</p>
              <Link href="/viec-lam" className="mt-3 inline-block text-sm font-medium text-foreground underline underline-offset-4">Tìm việc ngay</Link>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-border">
              {recentApplied.map(item => {
                const st = TRANG_THAI[item.trangThai] ?? { label: `#${item.trangThai}`, color: "text-muted-foreground bg-muted border-border" };
                return (
                  <div key={item.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-medium">Đơn #{item.id} — Tin #{item.tinTuyenDungId}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="size-3.5" /> {fmtDate(item.ngayUngTuyen)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={st.color}>{st.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-primary p-6 text-primary-foreground shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary-foreground/60">
                <Sparkles className="size-3.5" /> AI Smart Match
              </span>
              <span className="rounded-full bg-primary-foreground/10 px-2.5 py-1 text-[11px]">{matchCount} kết quả</span>
            </div>
            <div className="mt-6 text-sm text-primary-foreground/80">
              Hệ thống AI phân tích hồ sơ và gợi ý việc làm phù hợp dựa trên kỹ năng, kinh nghiệm và sở thích.
            </div>
            <Link href="/viec-lam/phu-hop" className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-primary-foreground py-3 text-xs font-medium text-primary transition hover:opacity-90">
              Xem việc phù hợp ngay
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <h3 className="font-medium tracking-tight">Hành động nhanh</h3>
            <div className="mt-4 space-y-2">
              <Link href="/ho-so" className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 text-sm font-medium transition hover:border-foreground/40">
                <span className="flex items-center gap-2"><Building2 className="size-4 text-muted-foreground" /> Cập nhật hồ sơ</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
              <Link href="/kinh-nghiem" className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 text-sm font-medium transition hover:border-foreground/40">
                <span className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /> Thêm kinh nghiệm</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
              <Link href="/ky-nang-ung-vien" className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 text-sm font-medium transition hover:border-foreground/40">
                <span className="flex items-center gap-2"><TrendingUp className="size-4 text-muted-foreground" /> Cập nhật kỹ năng</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}

/* ─── Recruiter / Admin Dashboard ──────────────────────────────────────────── */

function RecruiterAdminDashboard() {
  const identity = useStoredIdentity();
  const isAdmin = identity?.roles.some((r) => r.trim().toUpperCase() === "QUAN_TRI_VIEN") ?? false;

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={LayoutDashboard}
        title={isAdmin ? "Admin Dashboard" : "Recruiter Dashboard"}
        description={isAdmin ? "Quản trị hệ thống Smart Recruitment." : "Quản lý tuyển dụng và doanh nghiệp."}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isAdmin ? (
          <>
            <Link href="/user-roles" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-foreground/30">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-wider">Người dùng</span>
                <Users className="size-5" />
              </div>
              <div className="mt-6 text-4xl font-semibold tracking-tight">—</div>
              <p className="mt-2 text-xs text-muted-foreground">Quản lý tài khoản</p>
            </Link>
            <Link href="/tin-tuyen-dung" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-foreground/30">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-wider">Tin tuyển dụng</span>
                <Briefcase className="size-5" />
              </div>
              <div className="mt-6 text-4xl font-semibold tracking-tight">—</div>
              <p className="mt-2 text-xs text-muted-foreground">Duyệt tin</p>
            </Link>
            <Link href="/reports" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-foreground/30">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-wider">Báo cáo</span>
                <TrendingUp className="size-5" />
              </div>
              <div className="mt-6 text-4xl font-semibold tracking-tight">—</div>
              <p className="mt-2 text-xs text-muted-foreground">Thống kê hệ thống</p>
            </Link>
          </>
        ) : (
          <>
            <Link href="/tin-tuyen-dung" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-foreground/30">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-wider">Tin tuyển dụng</span>
                <Briefcase className="size-5" />
              </div>
              <div className="mt-6 text-4xl font-semibold tracking-tight">—</div>
              <p className="mt-2 text-xs text-muted-foreground">Quản lý tin đăng</p>
            </Link>
            <Link href="/ung-vien" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-foreground/30">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-wider">Ứng viên</span>
                <Users className="size-5" />
              </div>
              <div className="mt-6 text-4xl font-semibold tracking-tight">—</div>
              <p className="mt-2 text-xs text-muted-foreground">Xem hồ sơ ứng viên</p>
            </Link>
            <Link href="/doanh-nghiep" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-foreground/30">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-wider">Doanh nghiệp</span>
                <Building2 className="size-5" />
              </div>
              <div className="mt-6 text-4xl font-semibold tracking-tight">—</div>
              <p className="mt-2 text-xs text-muted-foreground">Hồ sơ công ty</p>
            </Link>
          </>
        )}
      </div>
    </AdminPageLayout>
  );
}
