"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Send, Bookmark, ArrowUpRight, ArrowRight, Sparkles, Building2, Clock, ChevronRight, TrendingUp, LayoutDashboard, Briefcase, Users, Plus, UserPlus, Eye, ListTodo } from "lucide-react";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState, AdminErrorState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { useStoredIdentity } from "@/hooks/use-stored-identity";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { cvApi } from "@/lib/api/cv-api";

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
  1: { label: "Lỗi xử lý hồ sơ", color: "text-destructive bg-destructive/5 border-destructive/30" },
  2: { label: "Chờ xử lý", color: "text-primary bg-primary/10 border-primary/30" },
  3: { label: "Đã xem", color: "text-teal bg-teal/10 border-teal/30" },
  4: { label: "Phù hợp", color: "text-primary bg-primary/10 border-primary/30" },
  5: { label: "Từ chối", color: "text-destructive bg-destructive/5 border-destructive/30" },
  6: { label: "Ứng viên rút đơn", color: "text-muted-foreground bg-muted border-border" },
  7: { label: "Quá hạn xử lý", color: "text-bronze bg-soft-gold border-bronze/30" },
  8: { label: "Tin tuyển dụng đã đóng", color: "text-muted-foreground bg-muted border-border" },
  9: { label: "Vô hiệu hóa", color: "text-muted-foreground bg-muted border-border" },
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
  const [cvCount, setCvCount] = useState<number | null>(null);
  const [jobTitles, setJobTitles] = useState<Record<number, string>>({});
  const { count: savedCount } = useBookmarks();

  const apiFetch = useCallback(async (url: string) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return body as ApiResponse<unknown> | null;
  }, []);

  useEffect(() => {
    void (async () => {
      const [donRes, hsRes, pqRes, tinRes] = await Promise.all([
        apiFetch("/api/dotnet/donungtuyens"),
        apiFetch("/api/dotnet/hosoungviens"),
        apiFetch("/api/dotnet/ketquaphuhops"),
        apiFetch("/api/dotnet/tintuyendungs"),
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
        const list = await cvApi.listCvs(hs.id);
        setCvCount(list.length);
      } catch {
        setCvCount(null);
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
        <Link href="/CV" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:border-foreground/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider">CV đã tạo</span>
            <FileText className="size-5" />
          </div>
          <div className="mt-6 text-4xl font-semibold tracking-tight">{cvCount ?? "—"}</div>
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

        <Link href="/viec-lam/phu-hop" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:border-foreground/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider">Việc phù hợp</span>
            <TrendingUp className="size-5" />
          </div>
          <div className="mt-6 text-4xl font-semibold tracking-tight">{matchCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">Kết quả AI gợi ý</p>
        </Link>

        <Link href="/viec-lam/da-luu" className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:border-foreground/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wider">Việc đã lưu</span>
            <Bookmark className="size-5" />
          </div>
          <div className="mt-6 text-4xl font-semibold tracking-tight">{savedCount}</div>
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
                const jobTitle = jobTitles[item.tinTuyenDungId];
                return (
                  <div key={item.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-medium">{jobTitle ?? `Tin #${item.tinTuyenDungId}`}</h3>
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

  if (!isAdmin) return <RecruiterControlCenter />;

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={LayoutDashboard}
        title="Admin Dashboard"
        description="Quản trị hệ thống Smart Recruitment."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </AdminPageLayout>
  );
}

/* ─── Recruiter Control Center (shared by NGUOI_DAI_DIEN + NHAN_SU) ──────────
   One shell, role-gated widgets. NGUOI_DAI_DIEN additionally sees the HR
   team block + invite shortcut; NHAN_SU sees the operational widgets only.
   All data comes from existing frontend endpoints (same shapes as the
   dedicated tab pages). Nothing invented, no new API calls. */

type TinLite = { id: number; tieuDe: string; trangThai: number; ngayHetHan: string; diaDiemLamViec: string };
type DonLite = { id: number; tinTuyenDungId: number; hoSoUngVienId: number; trangThai: number; ngayUngTuyen: string };
type HoSoLite = { id: number; hoTen: string; viTriUngTuyen: string };
type NhanSuLite = { hoTen: string; email: string; vaiTro: string; chucVu: string };

// Display-only stage grouping, derived from Domain.Enums.TrangThaiDonUngTuyen
// (KhoiTao=0, LoiXuLyHoSo=1, ChoXuLy=2, DaXem=3, PhuHop=4, TuChoi=5, ...).
// Backend semantics untouched: Mới = received & unviewed, Sàng lọc = opened
// or evaluated. Phỏng vấn / Offer / Đã tuyển have no domain status, so they
// render as "—" with an explanatory note instead of fabricated counts.
const STAGE_NEW = [0, 1, 2];
const STAGE_SCREEN = [3, 4];

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
  const [hosos, setHosos] = useState<HoSoLite[]>([]);
  const [team, setTeam] = useState<NhanSuLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const apiFetch = useCallback(async (url: string) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return body as ApiResponse<unknown> | null;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [jobRes, donRes, hsRes] = await Promise.all([
        apiFetch("/api/dotnet/tintuyendungs"),
        apiFetch("/api/dotnet/donungtuyens"),
        apiFetch("/api/dotnet/hosoungviens"),
      ]);
      if (jobRes && ok(jobRes)) {
        setJobs(
          extractArray(jobRes).map((v: unknown) => {
            const r = v as Record<string, unknown>;
            return {
              id: Number(r.id ?? r.Id ?? 0),
              tieuDe: `${r.tieuDe ?? r.TieuDe ?? ""}`,
              trangThai: Number(r.trangThai ?? r.TrangThai ?? 0),
              ngayHetHan: `${r.ngayHetHan ?? r.NgayHetHan ?? ""}`,
              diaDiemLamViec: `${r.diaDiemLamViec ?? r.DiaDiemLamViec ?? ""}`,
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
              trangThai: Number(r.trangThai ?? r.TrangThai ?? 0),
              ngayUngTuyen: `${r.ngayUngTuyen ?? r.NgayUngTuyen ?? ""}`,
            };
          }) as DonLite[],
        );
      }
      if (hsRes && ok(hsRes)) {
        setHosos(
          extractArray(hsRes).map((v: unknown) => {
            const r = v as Record<string, unknown>;
            return {
              id: Number(r.id ?? r.Id ?? 0),
              hoTen: `${r.hoTen ?? r.HoTen ?? ""}`,
              viTriUngTuyen: `${r.viTriUngTuyen ?? r.ViTriUngTuyen ?? ""}`,
            };
          }) as HoSoLite[],
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

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
  const stageNew = dons.filter((d) => STAGE_NEW.includes(d.trangThai)).length;
  const stageScreen = dons.filter((d) => STAGE_SCREEN.includes(d.trangThai)).length;

  const hoSoById = new Map(hosos.map((h) => [h.id, h]));
  const attentionCandidates = [...dons]
    .sort((a, b) => {
      const rank = (s: number) => (STAGE_NEW.includes(s) ? 0 : 1);
      if (rank(a.trangThai) !== rank(b.trangThai)) return rank(a.trangThai) - rank(b.trangThai);
      return new Date(b.ngayUngTuyen).getTime() - new Date(a.ngayUngTuyen).getTime();
    })
    .slice(0, 5);

  const teamByRole = team.reduce<Record<string, number>>((acc, m) => {
    const key = m.vaiTro || "—";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

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

  const kpis = [
    { icon: Briefcase, label: "Tin đang tuyển", value: `${activeJobs.length}`, sub: "đang hiển thị", href: "/tin-tuyen-dung" },
    { icon: Users, label: "Đơn mới chờ xem", value: `${unviewed.length}`, sub: "chưa mở hồ sơ", href: "/ung-vien" },
    { icon: Eye, label: "Đã xem / Phù hợp", value: `${stageScreen}`, sub: "đã mở hoặc đánh giá", href: "/ung-vien" },
    { icon: ListTodo, label: "Việc cần xử lý", value: `${attentionCount}`, sub: `${unviewed.length} đơn • ${expiringJobs.length} tin sắp hết hạn`, href: "/ung-vien" },
  ];

  // Only stages backed by real TrangThaiDonUngTuyen values. The system has
  // no interview/offer/hired statuses, so no such columns are rendered.
  const stages = [
    { label: "Mới", count: stageNew },
    { label: "Sàng lọc", count: stageScreen },
  ];

  return (
    <AdminPageLayout>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* C. Recruitment pipeline — real stages only */}
      <AdminCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-medium tracking-tight">Pipeline tuyển dụng</h2>
          <p className="text-xs text-muted-foreground">Dựa trên trạng thái thực của đơn ứng tuyển</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {stages.map((stage, i) => (
            <div key={stage.label} className="relative rounded-xl border border-border bg-background px-3 py-4 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {i + 1}. {stage.label}
              </p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight">{stage.count}</p>
            </div>
          ))}
        </div>
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
          {/* E. Candidates needing attention */}
          <AdminCard>
            <AdminCardHeader
              title="Ứng viên cần chú ý"
              description="Ưu tiên đơn chưa xem"
              action={
                <Link href="/ung-vien" className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-70">
                  Xem tất cả <ArrowRight className="size-3.5" />
                </Link>
              }
            />
            {attentionCandidates.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Chưa có đơn ứng tuyển nào.</p>
            ) : (
              <ul className="divide-y divide-border">
                {attentionCandidates.map((d) => {
                  const hs = hoSoById.get(d.hoSoUngVienId);
                  const st = TRANG_THAI[d.trangThai] ?? { label: `#${d.trangThai}`, color: "text-muted-foreground bg-muted border-border" };
                  const name = hs?.hoTen || `Ứng viên #${d.id}`;
                  return (
                    <li key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">{hs?.viTriUngTuyen || `Tin #${d.tinTuyenDungId}`} • {fmtDate(d.ngayUngTuyen)}</p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 ${st.color}`}>{st.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>

      {/* G. Today's tasks / attention */}
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
                <p className="flex-1"><span className="font-semibold">{unviewed.length}</span> CV chưa review</p>
                <Link href="/ung-vien" className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-70">
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

      {/* H. HR team — manager (NGUOI_DAI_DIEN) only */}
      {isManager && (
        <AdminCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-medium tracking-tight">Đội ngũ nhân sự • {team.length} thành viên</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {Object.keys(teamByRole).length > 0
                  ? Object.entries(teamByRole).map(([role, n]) => `${role}: ${n}`).join(" • ")
                  : "Chưa có dữ liệu phân vai"}
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
