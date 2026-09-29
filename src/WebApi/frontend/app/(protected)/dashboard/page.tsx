"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText, Send, Bookmark, ArrowRight, Clock, ChevronRight, TrendingUp, LayoutDashboard, Briefcase, Users, Plus, UserPlus, Eye, ListTodo, Bell, BarChart3, Filter, AlertTriangle } from "lucide-react";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminLoadingState, AdminErrorState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStoredIdentity } from "@/hooks/use-stored-identity";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { RecommendationPreview } from "@/features/recommendations/recommendation-preview";
import { MarketingBanner } from "@/features/marketing/marketing-banner";
import { AdminDashboard } from "@/features/admin/dashboard/admin-dashboard";
import { cvApi } from "@/lib/api/cv-api";
import { getValidToken, refreshSession } from "@/lib/auth-provider";
import type { HoSoVm } from "@/lib/types";

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };
type DonUngTuyen = { id: number; tinTuyenDungId: number; trangThai: number; ngayUngTuyen: string; tieuDe?: string };
type DashboardNotification = { id: number; message: string; isRead: boolean; created: string };

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

async function fetchDashboardApi(url: string): Promise<ApiResponse<unknown> | null> {
  let token = await getValidToken();
  const send = () => fetch(url, {
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  let res = await send();
  if (res.status === 401 && await refreshSession()) {
    token = await getValidToken();
    res = await send();
  }

  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return body as ApiResponse<unknown> | null;
}

const TRANG_THAI: Record<number, { label: string; color: string }> = {
  0: { label: "Khởi tạo", color: "text-muted-foreground bg-muted border-border" },
  1: { label: "Lỗi xử lý hồ sơ", color: "text-destructive bg-destructive/5 border-destructive/30" },
  2: { label: "Chờ xử lý", color: "text-primary bg-primary/10 border-primary/30" },
  3: { label: "Đã xem", color: "text-teal bg-teal/10 border-teal/30" },
  4: { label: "Ứng viên rút đơn", color: "text-muted-foreground bg-muted border-border" },
  5: { label: "Phù hợp", color: "text-primary bg-primary/10 border-primary/30" },
  6: { label: "Từ chối", color: "text-destructive bg-destructive/5 border-destructive/30" },
  7: { label: "Quá hạn xử lý", color: "text-bronze bg-soft-gold border-bronze/30" },
  8: { label: "Tin tuyển dụng đã đóng", color: "text-muted-foreground bg-muted border-border" },
  9: { label: "Vô hiệu hóa", color: "text-muted-foreground bg-muted border-border" },
};

const STATUS_BY_NAME: Record<string, number> = {
  khoitao: 0,
  loixulyhoso: 1,
  choxuly: 2,
  daxem: 3,
  phuhop: 5,
  tuchoi: 6,
  ungvienrutdon: 4,
  quahanxuly: 7,
  tintuyendungbidong: 8,
  vohieuhoa: 9,
};

const JOB_STATUS_BY_NAME: Record<string, number> = {
  nhap: 0,
  choduyethethong: 1,
  choadminduyet: 2,
  dangtuyen: 3,
  tamdung: 4,
  hethan: 5,
  dadong: 6,
  tuchoi: 7,
  bikhoa: 8,
  chonguoidaidienduyet: 9,
};

function parseTrangThai(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = `${value ?? ""}`.trim();
  if (/^\d+$/.test(text)) return Number(text);
  return STATUS_BY_NAME[text.toLowerCase().replace(/[\s_-]/g, "")] ?? -1;
}

function parseTrangThaiTin(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = `${value ?? ""}`.trim().toLowerCase().replace(/[\s_-]/g, "");
  if (/^\d+$/.test(text)) return Number(text);
  return JOB_STATUS_BY_NAME[text] ?? -1;
}

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

function getProfileCompletion(profile: HoSoVm | null) {
  if (!profile) return { percent: 0, missing: 7 };

  const fields = [
    profile.hoTen,
    profile.sdt,
    profile.diaChi,
    profile.viTriUngTuyen,
    profile.mucLuongMongMuon && profile.mucLuongMongMuon > 0,
    profile.gioiThieu,
    profile.anhDaiDienUrl,
  ];
  const completed = fields.filter((value) => Boolean(value)).length;
  return {
    percent: Math.round((completed / fields.length) * 100),
    missing: fields.length - completed,
  };
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
  const [profile, setProfile] = useState<HoSoVm | null>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [cvCount, setCvCount] = useState<number | null>(null);
  const [jobTitles, setJobTitles] = useState<Record<number, string>>({});
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [notificationRefresh, setNotificationRefresh] = useState(0);
  const { count: savedCount } = useBookmarks();

  const apiFetch = useCallback((url: string) => fetchDashboardApi(url), []);

  useEffect(() => {
    void (async () => {
      const [donRes, hsRes, pqRes, tinRes, notificationRes] = await Promise.all([
        apiFetch("/api/dotnet/donungtuyens?_start=0&_end=100"),
        apiFetch("/api/dotnet/hosoungviens"),
        apiFetch("/api/dotnet/ketquaphuhops"),
        apiFetch("/api/dotnet/tintuyendungs?_start=0&_end=100"),
        apiFetch("/api/dotnet/Notifications"),
      ]);

      if (donRes && ok(donRes)) {
        const items = extractArray(donRes).map((v: unknown) => {
          const r = v as Record<string, unknown>;
          return {
            id: Number(r.id ?? r.Id),
            tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
            trangThai: parseTrangThai(r.trangThai ?? r.TrangThai),
            ngayUngTuyen: `${r.ngayUngTuyen ?? r.NgayUngTuyen ?? ""}`,
            tieuDe: `${r.tieuDe ?? r.TieuDe ?? ""}`.trim() || undefined,
          };
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

      if (notificationRes) {
        const raw = notificationRes as unknown as Record<string, unknown>;
        const values = raw.notifications ?? raw.Notifications;
        if (Array.isArray(values)) {
          setNotifications(values.slice(0, 5).map((v) => {
            const r = v as Record<string, unknown>;
            return {
              id: Number(r.id ?? r.Id ?? 0),
              message: `${r.message ?? r.Message ?? ""}`,
              isRead: Boolean(r.isRead ?? r.IsRead ?? false),
              created: `${r.created ?? r.Created ?? ""}`,
            };
          }));
        }
      }

      if (pqRes && ok(pqRes)) {
        setMatchCount(extractArray(pqRes).length);
      }

      if (tinRes && ok(tinRes)) {
        const titles: Record<number, string> = {};
        for (const v of extractArray(tinRes)) {
          const r = v as Record<string, unknown>;
          const id = Number(r.id ?? r.Id ?? 0);
          const title = `${r.tieuDe ?? r.TieuDe ?? ""}`.trim();
          if (id && title) titles[id] = title;
        }
        setJobTitles(titles);
      }

      try {
        const hs = await cvApi.getMyHoSo();
        setProfile(hs);
        setProfileName(hs.hoTen || "bạn");
        const list = await cvApi.listCvs(hs.id);
        setCvCount(list.length);
      } catch {
        setCvCount(null);
      }
    })();
  }, [apiFetch, notificationRefresh]);

  const profileCompletion = getProfileCompletion(profile);

  useEffect(() => {
    const refreshFromNotification = () => setNotificationRefresh((value) => value + 1);
    window.addEventListener("recruitment:notification", refreshFromNotification);
    return () => window.removeEventListener("recruitment:notification", refreshFromNotification);
  }, []);

  return (
    <AdminPageLayout>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Workspace</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Dashboard</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
        <CardContent className="flex flex-col justify-between gap-6 p-6 sm:p-8 md:flex-row md:items-center">
          <div>
            <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-[0.2em]">Cổng ứng viên</Badge>
            <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Xin chào, {profileName}!</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Quản lý hành trình ứng tuyển và khám phá những cơ hội phù hợp với bạn.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/viec-lam" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover">
              <Briefcase className="size-4" /> Khám phá việc làm
            </Link>
            <Link href="/CV" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary">
              <FileText className="size-4" /> Tạo CV mới
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "CV của bạn", value: cvCount ?? "—", note: "Quản lý CV", icon: FileText, href: "/CV" },
          { label: "Sẵn sàng ứng tuyển", value: appliedCount, note: "Theo dõi trạng thái", icon: Send, href: "/viec-lam/da-ung-tuyen" },
          { label: "Việc phù hợp với bạn", value: matchCount, note: "Adam đã tìm thấy", icon: TrendingUp, href: "/viec-lam/phu-hop" },
          { label: "Việc bạn đã lưu", value: savedCount, note: "Cơ hội bạn quan tâm", icon: Bookmark, href: "/viec-lam/da-luu" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="group">
            <Card className="h-full border-border/80 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{item.label}</span>
                  <item.icon className="size-4 transition group-hover:text-primary" />
                </div>
                <div className="mt-4 text-3xl font-semibold tracking-tight">{item.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="space-y-6">
          <RecommendationPreview count={3} />

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-border/70 p-5 sm:p-6">
              <div>
                <CardTitle className="text-lg tracking-tight">Đơn ứng tuyển gần đây</CardTitle>
                <CardDescription className="mt-1">Theo dõi những cơ hội bạn đã gửi hồ sơ.</CardDescription>
              </div>
              <Link href="/viec-lam/da-ung-tuyen" className="shrink-0 text-xs font-medium text-primary hover:underline">Xem tất cả</Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentApplied.length === 0 ? (
                <div className="px-5 py-10 text-center sm:px-6">
                  <Send className="mx-auto size-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">Chưa có đơn ứng tuyển nào.</p>
                  <Link href="/viec-lam" className="mt-3 inline-flex text-sm font-medium text-primary underline underline-offset-4">Tìm việc ngay</Link>
                </div>
              ) : (
                <div className="divide-y divide-border/70">
                  {recentApplied.slice(0, 3).map((item) => {
                    const st = TRANG_THAI[item.trangThai] ?? { label: `#${item.trangThai}`, color: "text-muted-foreground bg-muted border-border" };
                    const jobTitle = jobTitles[item.tinTuyenDungId];
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Briefcase className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-medium">{item.tieuDe ?? jobTitle ?? "Vị trí ứng tuyển"}</h3>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" /> {fmtDate(item.ngayUngTuyen)}</p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[11px] ${st.color}`}>{st.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          <MarketingBanner />
        </div>

        <div className="space-y-6">
          <Card id="notifications" className="border-border/80 shadow-sm">
            <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg tracking-tight">Hồ sơ của bạn</CardTitle>
                  {/* <CardDescription className="mt-1">Tăng độ nổi bật với nhà tuyển dụng.</CardDescription> */}
                </div>
                <Link href="/ho-so" className="text-xs font-medium text-primary hover:underline">Chỉnh sửa</Link>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-3 sm:p-6 sm:pt-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-14 rounded-2xl">
                  {profile?.anhDaiDienUrl && <Image src={profile.anhDaiDienUrl} alt={profile.hoTen || "Ảnh hồ sơ"} width={56} height={56} className="size-full object-cover" />}
                  <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">{profile?.hoTen?.split(" ").map((part) => part[0]).slice(-2).join("").toUpperCase() || <UserPlus className="size-5" />}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{profile?.hoTen || profileName}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{profile?.viTriUngTuyen || "Chưa cập nhật vị trí ứng tuyển"}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs">
                <span className="font-medium">Hồ sơ hoàn thiện</span>
                <span className="font-semibold text-primary">{profileCompletion.percent}%</span>
              </div>
              <Progress value={profileCompletion.percent} className="mt-2 h-2" />
              <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 text-xs">
                <span className="text-muted-foreground">{profileCompletion.missing > 0 ? `Thiếu ${profileCompletion.missing} mục thông tin` : "Hồ sơ đã đầy đủ"}</span>
                <Badge variant={profile?.isTimViec === false ? "secondary" : "default"} className="text-[10px]">{profile?.isTimViec === false ? "Tạm dừng" : "Đang tìm việc"}</Badge>
              </div>
              <Link href="/ho-so" className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-border px-3 py-2.5 text-xs font-medium text-primary transition hover:border-primary/50 hover:bg-primary/5">
                Hoàn thiện hồ sơ <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5 pb-3 sm:p-6 sm:pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg tracking-tight"><Bell className="size-4 text-primary" /> Thông báo</CardTitle>
                <CardDescription className="mt-1">Cập nhật mới nhất dành cho bạn.</CardDescription>
              </div>
              <Link href="#notifications" className="text-xs font-medium text-primary hover:underline">Xem tất cả</Link>
            </CardHeader>
            <CardContent className="p-5 pt-2 sm:p-6 sm:pt-2">
              {notifications.length === 0 ? (
                <div className="rounded-xl bg-muted/50 px-4 py-6 text-center text-xs text-muted-foreground">Chưa có thông báo mới.</div>
              ) : (
                <div className="divide-y divide-border/70">
                  {notifications.slice(0, 4).map((notification) => (
                    <div key={notification.id} className={`flex gap-3 py-3 first:pt-2 last:pb-1 ${!notification.isRead ? "font-medium" : ""}`}>
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-border" : "bg-primary"}`} />
                      <div className="min-w-0"><p className="line-clamp-2 text-sm text-foreground">{notification.message}</p><p className="mt-1 text-[11px] font-normal text-muted-foreground">{fmtDate(notification.created)}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="p-5 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-base tracking-tight">Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 p-5 pt-2 sm:p-6 sm:pt-2">
              <Link href="/ho-so" className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition hover:border-primary/40 hover:text-primary">
                <span className="flex items-center gap-2"><UserPlus className="size-4" /> Cập nhật hồ sơ</span><ChevronRight className="size-4 text-muted-foreground" />
              </Link>
              <Link href="/CV" className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition hover:border-primary/40 hover:text-primary">
                <span className="flex items-center gap-2"><FileText className="size-4" /> Quản lý CV</span><ChevronRight className="size-4 text-muted-foreground" />
              </Link>
              <Link href="/viec-lam/da-ung-tuyen" className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition hover:border-primary/40 hover:text-primary">
                <span className="flex items-center gap-2"><Send className="size-4" /> Xem đơn đã nộp</span><ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageLayout>
  );
}

/* ─── Recruiter / Admin Dashboard ──────────────────────────────────────────── */

function RecruiterAdminDashboard() {
  const identity = useStoredIdentity();
  const isAdmin = identity?.roles.some((r) => r.trim().toUpperCase() === "QUAN_TRI_VIEN") ?? false;

  if (!isAdmin) return <RecruiterControlCenter />;

  return <AdminDashboard />;
}

/* ─── Recruiter Control Center (shared by NGUOI_DAI_DIEN + NHAN_SU) ──────────
   One shell, role-gated widgets. NGUOI_DAI_DIEN additionally sees the HR
   team block + invite shortcut; NHAN_SU sees the operational widgets only.
   All data comes from existing frontend endpoints (same shapes as the
   dedicated tab pages). Nothing invented, no new API calls. */

type TinLite = { id: number; tieuDe: string; trangThai: number; ngayHetHan: string; diaDiemLamViec: string; nguoiDangTinId: number };
type DonLite = { id: number; tinTuyenDungId: number; hoSoUngVienId: number; trangThai: number; ngayUngTuyen: string };
type NhanSuLite = { nguoiDungId: number; hoTen: string; email: string; vaiTro: string; chucVu: string };

// Display-only stage grouping, derived from Domain.Enums.TrangThaiDonUngTuyen
// (KhoiTao=0, LoiXuLyHoSo=1, ChoXuLy=2, DaXem=3, PhuHop=4, TuChoi=5, ...).
// Backend semantics untouched: Mới = received & unviewed, Sàng lọc = opened
// or evaluated. Phỏng vấn / Offer / Đã tuyển have no domain status, so they
// render as "—" with an explanatory note instead of fabricated counts.
const STAGE_NEW = [0, 1, 2];

function shortDay(date: Date) {
  return date.toLocaleDateString("vi-VN", { weekday: "short" }).replace(".", "");
}

function sameLocalDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

function RecruiterControlCenter() {
  const identity = useStoredIdentity();
  const isManager = identity?.roles.some((r) => r.trim().toUpperCase() === "NGUOI_DAI_DIEN") ?? false;

  const [jobs, setJobs] = useState<TinLite[]>([]);
  const [dons, setDons] = useState<DonLite[]>([]);
  const [team, setTeam] = useState<NhanSuLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>();

  const apiFetch = useCallback((url: string) => fetchDashboardApi(url), []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [jobRes, donRes] = await Promise.all([
        apiFetch("/api/dotnet/tintuyendungs?_start=0&_end=100"),
        apiFetch("/api/dotnet/donungtuyens?_start=0&_end=100"),
      ]);
      if (jobRes && ok(jobRes)) {
        setJobs(
          extractArray(jobRes).map((v: unknown) => {
            const r = v as Record<string, unknown>;
              return {
                id: Number(r.id ?? r.Id ?? 0),
                tieuDe: `${r.tieuDe ?? r.TieuDe ?? ""}`,
                trangThai: parseTrangThaiTin(r.trangThai ?? r.TrangThai),
                ngayHetHan: `${r.ngayHetHan ?? r.NgayHetHan ?? ""}`,
                diaDiemLamViec: `${r.diaDiemLamViec ?? r.DiaDiemLamViec ?? ""}`,
                nguoiDangTinId: Number(r.nguoiDangTinId ?? r.NguoiDangTinId ?? 0),
              };
          }) as TinLite[],
        );
      }
      if (donRes && ok(donRes)) {
        setDons(
          extractArray(donRes).map((v: unknown) => {
            const r = v as Record<string, unknown>;
            return {
              id: Number(r.id ?? r.Id ?? 0),
              tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
              hoSoUngVienId: Number(r.hoSoUngVienId ?? r.HoSoUngVienId ?? 0),
              trangThai: parseTrangThai(r.trangThai ?? r.TrangThai),
              ngayUngTuyen: `${r.ngayUngTuyen ?? r.NgayUngTuyen ?? ""}`,
            };
          }) as DonLite[],
        );
      }
      // Manager-only: HR roster for the team block (NHAN_SU never fetches this).
      if (isManager) {
        const teamRes = await apiFetch("/api/dotnet/nhansus");
        if (teamRes && ok(teamRes)) {
          setTeam(
            extractArray(teamRes).map((v: unknown) => {
              const r = v as Record<string, unknown>;
              return {
                nguoiDungId: Number(r.nguoiDungId ?? r.NguoiDungId ?? 0),
                hoTen: `${r.hoTen ?? r.HoTen ?? ""}`,
                email: `${r.email ?? r.Email ?? ""}`,
                vaiTro: `${r.vaiTro ?? r.VaiTro ?? ""}`,
                chucVu: `${r.chucVu ?? r.ChucVu ?? ""}`,
              };
            }) as NhanSuLite[],
          );
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, isManager]);

  useEffect(() => {
    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") void load();
    };
    const interval = window.setInterval(refreshWhenActive, 30_000);
    window.addEventListener("focus", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, [load]);

  const activeJobs = jobs.filter((j) => j.trangThai === 3);
  const appsByJob = new Map<number, { total: number; fresh: number }>();
  for (const d of dons) {
    const cur = appsByJob.get(d.tinTuyenDungId) ?? { total: 0, fresh: 0 };
    cur.total += 1;
    if (STAGE_NEW.includes(d.trangThai)) cur.fresh += 1;
    appsByJob.set(d.tinTuyenDungId, cur);
  }
  const unviewed = dons.filter((d) => STAGE_NEW.includes(d.trangThai));
  const expiringJobs = activeJobs.filter((j) => {
    const d = daysUntil(j.ngayHetHan);
    return d !== null && d >= 0 && d <= 7;
  });
  const attentionCount = unviewed.length + expiringJobs.length;
  const [pipelineJobId, setPipelineJobId] = useState("all");
  const [pipelineStatus, setPipelineStatus] = useState("all");
  const filteredPipelineDons = dons.filter((don) => {
    if (pipelineJobId !== "all" && don.tinTuyenDungId !== Number(pipelineJobId)) return false;
    if (pipelineStatus !== "all" && don.trangThai !== Number(pipelineStatus)) return false;
    return true;
  });
  const stageNew = filteredPipelineDons.filter((d) => STAGE_NEW.includes(d.trangThai)).length;

  const activityByMember = team.map((member) => {
    const memberJobs = jobs.filter((job) => job.nguoiDangTinId === Number((member as NhanSuLite & { nguoiDungId?: number }).nguoiDungId ?? 0));
    const memberJobIds = new Set(memberJobs.map((job) => job.id));
    return {
      ...member,
      jobCount: memberJobs.length,
      applicantCount: dons.filter((don) => memberJobIds.has(don.tinTuyenDungId)).length,
    };
  });

  if (loading) {
    return (
      <AdminPageLayout>
        <AdminLoadingState />
      </AdminPageLayout>
    );
  }

  if (err && jobs.length === 0 && dons.length === 0) {
    return (
      <AdminPageLayout>
        <AdminErrorState message={err} onRetry={() => void load()} />
      </AdminPageLayout>
    );
  }

  const kpis = isManager
    ? [
        { icon: Briefcase, label: "Tin đang tuyển", value: `${activeJobs.length}`, sub: `${jobs.length} tin trong doanh nghiệp`, href: "/tin-tuyen-dung" },
        { icon: Users, label: "Ứng viên", value: `${new Set(dons.map((don) => don.hoSoUngVienId)).size}`, sub: `${dons.length} lượt ứng tuyển`, href: "/ung-vien" },
        { icon: UserPlus, label: "Nhân sự", value: `${team.length}`, sub: "thành viên trong đội ngũ", href: "/nhan-su" },
        { icon: Eye, label: "Đơn mới chờ xem", value: `${unviewed.length}`, sub: "cần được xử lý", href: "/ung-vien?status=2" },
        { icon: ListTodo, label: "Việc cần xử lý", value: `${attentionCount}`, sub: `${unviewed.length} đơn • ${expiringJobs.length} tin sắp hết hạn`, href: "/ung-vien?status=2" },
      ]
    : [
        { icon: Briefcase, label: "Tin đang đăng", value: `${jobs.length}`, sub: `${activeJobs.length} tin đang tuyển`, href: "/tin-tuyen-dung" },
        { icon: Users, label: "Đơn ứng tuyển", value: `${dons.length}`, sub: "thuộc các tin bạn phụ trách", href: "/ung-vien" },
        { icon: Clock, label: "Chờ xử lý", value: `${unviewed.length}`, sub: "đơn chưa xem", href: "/ung-vien?status=2" },
      ];

  // Only stages backed by real TrangThaiDonUngTuyen values. The system has
  // no interview/offer/hired statuses, so no such columns are rendered.
  const stages = [
    { label: "Mới nhận", count: stageNew, note: "Chờ xử lý" },
    { label: "Đã xem", count: filteredPipelineDons.filter((d) => d.trangThai === 3).length, note: "Đã mở hồ sơ" },
    { label: "Phù hợp", count: filteredPipelineDons.filter((d) => d.trangThai === 5).length, note: "Được đánh giá" },
    { label: "Kết thúc", count: filteredPipelineDons.filter((d) => [4, 6, 7, 8, 9].includes(d.trangThai)).length, note: "Từ chối / rút / đóng" },
  ];

  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return {
      label: shortDay(date),
      date,
      count: dons.filter((don) => {
        const applied = new Date(don.ngayUngTuyen);
        return applied >= date && applied < next;
      }).length,
    };
  });
  const trendMax = Math.max(1, ...trend.map((point) => point.count));
  const highFit = dons.filter((don) => don.trangThai === 5);
  const calendarMarkedDates = [
    ...dons.map((don) => new Date(don.ngayUngTuyen)).filter((date) => !Number.isNaN(date.getTime())),
    ...expiringJobs.map((job) => new Date(job.ngayHetHan)).filter((date) => !Number.isNaN(date.getTime())),
  ];
  const selectedCalendarEvents = selectedCalendarDate
    ? {
        applications: dons.filter((don) => sameLocalDay(new Date(don.ngayUngTuyen), selectedCalendarDate)).length,
        expiring: expiringJobs.filter((job) => sameLocalDay(new Date(job.ngayHetHan), selectedCalendarDate)).length,
      }
    : null;

  return (
    <AdminPageLayout>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Workspace</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Dashboard</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <AdminPageHeader
        icon={LayoutDashboard}
        title="Recruitment Dashboard"
        description="Trung tâm điều hành tuyển dụng hằng ngày của bạn."
        actions={
          <>
            <Link href="/tin-tuyen-dung" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
              <Plus className="size-4" /> Đăng tin tuyển dụng
            </Link>
            <Link href="/ung-vien" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-foreground/40">
              Xem ứng viên <ArrowRight className="size-4" />
            </Link>
            {isManager && (
              <Link href="/nhan-su" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-foreground/40">
                <UserPlus className="size-4" /> Mời nhân sự
              </Link>
            )}
          </>
        }
      />

      {/* B. KPI row */}
      <div className={`grid gap-4 sm:grid-cols-2 ${isManager ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-foreground/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <kpi.icon className="size-4 text-primary" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{kpi.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
          </Link>
        ))}
      </div>

      {isManager && (
        <AdminCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-medium tracking-tight"><BarChart3 className="size-4 text-primary" /> Application trend</h2>
              <p className="mt-1 text-xs text-muted-foreground">Số lượt ứng tuyển trong 7 ngày gần nhất</p>
            </div>
            <span className="text-xs text-muted-foreground">Tổng: {dons.length} lượt</span>
          </div>
          <div className="mt-6 flex h-40 items-end gap-2 sm:gap-4">
            {trend.map((point) => (
              <div key={point.date.toISOString()} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-semibold text-foreground">{point.count || ""}</span>
                <div className="flex h-24 w-full items-end rounded-lg bg-muted/40 px-1">
                  <div className="flex h-full w-full items-end" title={`${point.count} lượt ứng tuyển`}>
                    <Progress value={Math.max(point.count ? 12 : 4, (point.count / trendMax) * 100)} className="h-full w-full rotate-180 rounded-md [&>div]:rounded-md" />
                  </div>
                </div>
                <span className="text-[10px] capitalize text-muted-foreground">{point.label}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {!isManager && (
        <AdminCard>
          <AdminCardHeader title="Action required" description="Các việc cần ưu tiên xử lý" />
          <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><AlertTriangle className="size-4 text-primary" /><h3 className="text-sm font-medium">Đơn mới chưa xem</h3></div>
                <Link href="/ung-vien?status=2" className="text-xs font-medium text-primary hover:underline">Xem ngay</Link>
              </div>
              <p className="mt-4 text-3xl font-semibold">{unviewed.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">đơn đang chờ bạn mở hồ sơ</p>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Clock className="size-4 text-primary" /><h3 className="text-sm font-medium">Tin sắp hết hạn</h3></div>
                <Link href="/tin-tuyen-dung" className="text-xs font-medium text-primary hover:underline">Xem tất cả</Link>
              </div>
              <p className="mt-4 text-3xl font-semibold">{expiringJobs.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">trong 7 ngày tới</p>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><TrendingUp className="size-4 text-primary" /><h3 className="text-sm font-medium">Ứng viên phù hợp</h3></div>
                <Link href="/ung-vien?status=4" className="text-xs font-medium text-primary hover:underline">Xem ngay</Link>
              </div>
              <p className="mt-4 text-3xl font-semibold">{highFit.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">đã phù hợp nhưng chưa xử lý tiếp</p>
            </div>
          </div>
        </AdminCard>
      )}

      <AdminCard className="p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-base font-medium tracking-tight"><Clock className="size-4 text-primary" /> Lịch tuyển dụng</h2>
            <p className="mt-1 text-xs text-muted-foreground">Theo dõi ngày có đơn ứng tuyển và tin sắp hết hạn.</p>
            {selectedCalendarDate && selectedCalendarEvents && (
              <div className="mt-5 rounded-xl bg-muted/40 p-4 text-sm">
                <p className="font-medium">{selectedCalendarDate.toLocaleDateString("vi-VN")}</p>
                <p className="mt-2 text-xs text-muted-foreground">{selectedCalendarEvents.applications} lượt ứng tuyển • {selectedCalendarEvents.expiring} tin hết hạn</p>
              </div>
            )}
          </div>
          <Calendar selected={selectedCalendarDate} markedDates={calendarMarkedDates} onSelect={setSelectedCalendarDate} />
        </div>
      </AdminCard>

      {/* C. Recruitment pipeline — real stages only */}
      <AdminCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-medium tracking-tight">Pipeline tuyển dụng</h2>
            <p className="mt-1 text-xs text-muted-foreground">Số ứng viên đi qua từng trạng thái thực của đơn ứng tuyển</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-3.5 text-muted-foreground" />
            <Select value={pipelineJobId} onValueChange={(value) => { if (value !== null) setPipelineJobId(value); }}>
              <SelectTrigger className="h-9 w-auto min-w-32 rounded-lg px-2 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tin</SelectItem>
                {jobs.map((job) => <SelectItem key={job.id} value={String(job.id)}>{job.tieuDe || `Tin #${job.id}`}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={pipelineStatus} onValueChange={(value) => { if (value !== null) setPipelineStatus(value); }}>
              <SelectTrigger className="h-9 w-auto min-w-40 rounded-lg px-2 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(TRANG_THAI).map(([value, state]) => <SelectItem key={value} value={value}>{state.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, i) => (
            <div key={stage.label} className="relative flex items-center gap-3">
              <div className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{stage.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{stage.note}</p>
                  </div>
                  <p className="ml-auto text-2xl font-semibold tracking-tight">{stage.count}</p>
                </div>
              </div>
              {i < stages.length - 1 && <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground lg:block" aria-hidden="true" />}
            </div>
          ))}
        </div>
        <p className="mt-3 text-right text-[11px] text-muted-foreground">{filteredPipelineDons.length} đơn phù hợp bộ lọc</p>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* D. Active jobs */}
        <AdminCard className="lg:col-span-3">
          <AdminCardHeader
            title="Tin đang tuyển"
            description={`${activeJobs.length} tin đang hiển thị`}
            action={
              <Link href="/tin-tuyen-dung" className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-70">
                Xem tất cả <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {activeJobs.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-8 text-sm text-muted-foreground">
              <Briefcase className="size-5 shrink-0" />
              <p>Chưa có tin nào đang tuyển. <Link href="/tin-tuyen-dung" className="font-medium text-foreground underline underline-offset-4">Đăng tin ngay</Link></p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {activeJobs.slice(0, 5).map((job) => {
                const stat = appsByJob.get(job.id) ?? { total: 0, fresh: 0 };
                const exp = daysUntil(job.ngayHetHan);
                return (
                  <li key={job.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{job.tieuDe || `Tin #${job.id}`}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {stat.total} ứng viên</span>
                        {stat.fresh > 0 && (
                          <span className="rounded-full bg-sandsoft px-2 py-0.5 font-medium text-foreground">+{stat.fresh} mới</span>
                        )}
                        {exp !== null && exp >= 0 && exp <= 7 && (
                          <span className="inline-flex items-center gap-1 text-foreground"><Clock className="size-3.5" /> Hết hạn trong {exp} ngày</span>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-sage/40 bg-soft-sage text-foreground">Đang tuyển</Badge>
                    <Link href="/tin-tuyen-dung" aria-label={`Quản lý ${job.tieuDe}`} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
                      <ChevronRight className="size-4" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>

        <div className="space-y-4 lg:col-span-2">
          {/* E. HR activity */}
          <AdminCard>
            <AdminCardHeader
              title="Hoạt động nhân sự"
              description="Tin đăng và ứng viên theo người phụ trách"
              action={
                <Link href="/nhan-su" className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-70">
                  Quản lý <ArrowRight className="size-3.5" />
                </Link>
              }
            />
            {activityByMember.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Chưa có dữ liệu nhân sự.</p>
            ) : (
              <ul className="divide-y divide-border">
                {activityByMember.slice(0, 5).map((member) => (
                    <li key={member.email || member.hoTen} className="flex items-center gap-3 px-5 py-3.5">
                      <Avatar className="size-9 bg-primary/10 text-xs text-primary"><AvatarFallback className="bg-primary/10 text-primary">{(member.hoTen || member.email).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{member.hoTen || member.email || "Nhân sự"}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.chucVu || "Nhân sự tuyển dụng"}</p>
                      </div>
                      <div className="shrink-0 text-right text-xs">
                        <p className="font-semibold">{member.jobCount} tin</p>
                        <p className="text-muted-foreground">{member.applicantCount} ứng viên</p>
                      </div>
                    </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>

      {/* F. Today's tasks / attention */}
      <AdminCard>
        <AdminCardHeader title="Việc cần xử lý hôm nay" description="Tổng hợp từ đơn chưa xem và tin sắp hết hạn" />
        {attentionCount === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Mọi thứ đã được xử lý. Làm tốt lắm!</p>
        ) : (
          <ul className="divide-y divide-border">
            {unviewed.length > 0 && (
              <li className="flex items-center gap-3 px-5 py-3.5 text-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sandsoft">
                  <FileText className="size-4 text-foreground" />
                </span>
                <p className="flex-1"><span className="font-semibold">{unviewed.length}</span> đơn mới chưa xem</p>
                <Link href="/ung-vien?status=2" className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-70">
                  Xem ngay <ArrowRight className="size-3.5" />
                </Link>
              </li>
            )}
            {expiringJobs.map((job) => (
              <li key={job.id} className="flex items-center gap-3 px-5 py-3.5 text-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sandsoft">
                  <Clock className="size-4 text-foreground" />
                </span>
                <p className="min-w-0 flex-1 truncate">Tin <span className="font-medium">{job.tieuDe || `#${job.id}`}</span> hết hạn trong {daysUntil(job.ngayHetHan)} ngày</p>
                <Link href="/tin-tuyen-dung" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-70">
                  Gia hạn <ArrowRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {/* G. HR overview — manager (NGUOI_DAI_DIEN) only */}
      {isManager && (
        <AdminCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-medium tracking-tight">HR overview • {team.length} thành viên</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {team.length > 0 ? `${activeJobs.length} tin đang tuyển • ${dons.length} lượt ứng tuyển • ${unviewed.length} đơn cần review` : "Chưa có dữ liệu phân vai"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {team.slice(0, 5).map((m, i) => (
                <span key={`${m.email}-${i}`} title={`${m.hoTen} (${m.email})`} className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-[11px] font-semibold text-foreground">
                  {(m.hoTen || m.email).slice(0, 2).toUpperCase()}
                </span>
              ))}
              <Link href="/nhan-su" className="ml-1 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                <UserPlus className="size-4" /> Mở Nhân sự
              </Link>
            </div>
          </div>
        </AdminCard>
      )}
    </AdminPageLayout>
  );
}
