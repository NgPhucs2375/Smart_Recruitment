"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useGetIdentity } from "@refinedev/core";
import { BarChart3, Briefcase, Download, RefreshCw, Send, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AdminPageLayout, AdminLoadingState, AdminEmptyState } from "@/components/admin/admin-page-layout";
import { getValidToken, refreshSession } from "@/lib/auth-provider";
import { unwrapResponse } from "@/lib/api/response-contract";

const STATUSES = [{ id: 2, label: "Chờ xử lý" }, { id: 3, label: "Đã xem" }, { id: 5, label: "Phù hợp" }, { id: 6, label: "Từ chối" }, { id: 4, label: "Ứng viên rút đơn" }];

/** Màu Badge định danh chuẩn UX theo trạng thái hồ sơ. */
const STATUS_STYLES = [
  "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  "bg-slate-500/15 text-slate-600 dark:text-slate-400",
];

const PERIODS = [
  { id: "30", label: "30 ngày qua" },
  { id: "90", label: "90 ngày qua" },
  { id: "all", label: "Toàn bộ thời gian" },
] as const;

type PeriodId = (typeof PERIODS)[number]["id"];

/** Donut SVG thuần (không thêm dependency): tỷ lệ phù hợp trên đã đánh giá. */
function MatchDonut({ ratio }: { ratio: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`Tỷ lệ phù hợp ${ratio}%`}>
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="14" className="stroke-muted" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          stroke="currentColor"
          className="text-primary transition-all"
          strokeDasharray={`${(ratio / 100) * c} ${c}`}
          transform="rotate(-90 64 64)"
        />
        <text x="64" y="64" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-2xl font-bold">
          {ratio}%
        </text>
      </svg>
    </div>
  );
}

type KetQuaItem = { TrangThaiId: number; TrangThai: string; SoLuong: number };
type XuHuongItem = { Ngay: string; SoLuong: number };
type TopTinItem = { Id: number; TieuDe: string; TrangThaiId: number; TrangThai: string; SoLuong: number };
type DuyetTin = { DaDuyet: number; ChoDuyet: number; TuChoi: number; Nhap: number; TyLeDuyet: number | null };

/** Khớp 1-1 với BaoCaoTuyenDungVm trả từ GET /api/baocao (JSON PascalCase). */
type Report = {
  GeneratedAtUtc: string;
  KyNgay: number;
  PhamVi: string;
  TinDaDang: number;
  TinKyTruoc: number | null;
  TyLeTin: number | null;
  LuotNop: number;
  LuotNopKyTruoc: number | null;
  TyLeNop: number | null;
  UngVienDuyNhat: number;
  KetQua: KetQuaItem[];
  XuHuong: XuHuongItem[];
  TopTin: TopTinItem[];
  DuyetTin: DuyetTin;
};

const fmt = (n: number) => n.toLocaleString("vi-VN");

function GrowthNote({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-xs text-muted-foreground">So với kỳ trước: —</span>;
  const up = value > 0;
  const flat = value === 0;
  const Icon = flat ? TrendingUp : up ? TrendingUp : TrendingDown;
  const tone = flat ? "text-muted-foreground" : up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
  const text = flat ? "0%" : `${up ? "+" : ""}${value.toLocaleString("vi-VN")}%`;
  return (
    <span className={`mt-1 flex items-center gap-1 text-xs ${tone}`}>
      <Icon className="size-3.5" /> {text} <span className="font-normal text-muted-foreground">so với kỳ trước</span>
    </span>
  );
}

export default function ReportsPage() {
  const { data: identity } = useGetIdentity<{ roles?: string[] }>();
  const allowed = identity?.roles?.some(role => ["QUAN_TRI_VIEN", "NGUOI_DAI_DIEN", "NHAN_SU"].includes(role.toUpperCase())) ?? false;
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodId>("30");
  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true); setError("");
    try {
      const ky = period === "all" ? 0 : Number(period);
      let token = await getValidToken();
      const send = () => fetch(`/api/dotnet/baocao?ky=${ky}`, {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      let response = await send();
      if (response.status === 401 && await refreshSession()) {
        token = await getValidToken();
        response = await send();
      }
      if (!response.ok) throw new Error(response.status === 403
        ? "Bạn không có quyền xem báo cáo tuyển dụng."
        : `Không tải được báo cáo (HTTP ${response.status}).`);
      const body = await response.json().catch(() => null);
      const data = unwrapResponse<Report>(body);
      if (!data || typeof data !== "object" || !Array.isArray(data.KetQua)) throw new Error("Phản hồi báo cáo không hợp lệ.");
      setReport(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không tải được báo cáo."); }
    finally { setLoading(false); }
  }, [allowed, period]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    const refresh = () => { void load(); };
    window.addEventListener("recruitment:notification", refresh);
    return () => { clearTimeout(timer); window.removeEventListener("recruitment:notification", refresh); };
  }, [load]);

  const exportCsv = useCallback(async () => {
    if (!report) {
      toast.error("Chưa có số liệu để xuất.");
      return;
    }
    try {
      let token = await getValidToken();
      const ky = period === "all" ? 0 : Number(period);
      const send = () => fetch(`/api/dotnet/baocao/csv?ky=${ky}`, {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      let response = await send();
      if (response.status === 401 && await refreshSession()) {
        token = await getValidToken();
        response = await send();
      }
      if (!response.ok) throw new Error(`Không xuất được CSV (HTTP ${response.status}).`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao-cao-tuyen-dung-ky-${ky}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất báo cáo CSV từ máy chủ.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Xuất CSV thất bại.");
    }
  }, [report, period]);

  if (identity && !allowed) return <AdminPageLayout><AdminEmptyState icon={BarChart3} title="Báo cáo dành cho nhà tuyển dụng và Admin" description="Tài khoản của bạn không có quyền xem báo cáo tuyển dụng." /></AdminPageLayout>;

  const ketQuaTheoId = new Map((report?.KetQua ?? []).map(k => [k.TrangThaiId, k.SoLuong]));
  const outcomes = STATUSES.map(s => ketQuaTheoId.get(s.id) ?? 0);
  const khac = (report?.KetQua ?? []).filter(k => !STATUSES.some(s => s.id === k.TrangThaiId)).reduce((sum, k) => sum + k.SoLuong, 0);
  const completed = outcomes[2] + outcomes[3];
  const ratio = completed > 0 ? Math.round((outcomes[2] / completed) * 100) : 0;
  const maxOutcome = Math.max(1, ...outcomes, khac);
  const trend = report?.XuHuong ?? [];
  const maxTrend = trend.length ? Math.max(...trend.map(point => point.SoLuong)) : 1;
  const trendLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  const duyet = report?.DuyetTin;
  const maxDuyet = Math.max(1, duyet?.DaDuyet ?? 0, duyet?.ChoDuyet ?? 0, duyet?.TuChoi ?? 0);
  const maxTop = report && report.TopTin.length ? Math.max(...report.TopTin.map(t => t.SoLuong)) : 1;
  return <AdminPageLayout>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Báo cáo &amp; thống kê</h1>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="rounded-full" disabled={loading} onClick={() => void load()}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Tải lại
        </Button>
        <Button variant="outline" size="sm" className="rounded-full" disabled={loading || !report} onClick={() => void exportCsv()}>
          <Download className="size-4" /> Xuất CSV
        </Button>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Kỳ báo cáo:</span>
      <Select value={period} onValueChange={value => { if (value !== null) setPeriod(value as PeriodId); }}>
        <SelectTrigger aria-label="Chọn kỳ báo cáo" className="h-9 w-auto rounded-full px-4 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>{PERIODS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
      </Select>
      {report?.PhamVi === "doanh-nghiep" && <Badge variant="secondary">Phạm vi: doanh nghiệp của bạn</Badge>}
      {report?.PhamVi === "he-thong" && <Badge variant="secondary">Phạm vi: toàn hệ thống</Badge>}
    </div>
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
    {loading ? <AdminLoadingState /> : report && <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl"><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">Tin đăng</p><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Briefcase className="size-4 text-primary" /></span></div><p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{fmt(report.TinDaDang)}</p><GrowthNote value={report.TyLeTin} /></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">Ứng viên</p><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Users className="size-4 text-primary" /></span></div><p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{fmt(report.UngVienDuyNhat)}</p><p className="mt-1 text-xs text-muted-foreground">Ứng viên duy nhất trong kỳ</p></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">Lượt nộp</p><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Send className="size-4 text-primary" /></span></div><p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{fmt(report.LuotNop)}</p><GrowthNote value={report.TyLeNop} /></CardContent></Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Xu hướng ứng tuyển theo thời gian</h2>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            {trend.length === 0 ? (
              <AdminEmptyState
                icon={TrendingUp}
                title="Chưa có số liệu thống kê"
                description="Biểu đồ xu hướng và phân tích hiệu suất sẽ tự động cập nhật ngay khi doanh nghiệp có hoạt động tuyển dụng."
              />
            ) : (
              <div>
                <div className="flex h-40 items-end gap-1" role="img" aria-label={`Số lượt nộp theo ngày, cao nhất ${maxTrend} lượt`}>
                  {trend.map(point => (
                    <div key={point.Ngay} className="flex h-full flex-1 items-end" title={`${trendLabel(point.Ngay)}: ${point.SoLuong} lượt`}>
                      <div className="w-full rounded-t-md bg-primary/75 transition-colors hover:bg-primary" style={{ height: `${Math.max(6, (point.SoLuong / maxTrend) * 100)}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{trendLabel(trend[0].Ngay)}</span>
                  <span>{trendLabel(trend[trend.length - 1].Ngay)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Trạng thái hồ sơ</CardTitle><CardDescription>Phân bổ hồ sơ theo từng trạng thái xử lý trong kỳ báo cáo.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {STATUSES.map((status, i) => <div key={status.id}><p className="flex items-center justify-between text-sm"><Badge className={STATUS_STYLES[i]}>{status.label}</Badge><span className="tabular-nums">{outcomes[i]}</span></p><Progress className="mt-2" value={Math.max(0, outcomes[i] / maxOutcome * 100)} /></div>)}
            {khac > 0 && <div><p className="flex items-center justify-between text-sm"><Badge className={STATUS_STYLES[5]}>Trạng thái khác</Badge><span className="tabular-nums">{khac}</span></p><Progress className="mt-2" value={Math.max(0, khac / maxOutcome * 100)} /></div>}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Tỷ lệ đánh giá phù hợp</CardTitle><CardDescription>Tính trên các hồ sơ đã được kết luận Phù hợp hoặc Từ chối trong kỳ.</CardDescription></CardHeader>
          <CardContent>
            <MatchDonut ratio={ratio} />
            <p className="mt-4 text-sm text-muted-foreground">{outcomes[2]} hồ sơ phù hợp trên {completed} hồ sơ đã được đánh giá.</p>
            {completed === 0 && <p className="mt-2 text-xs text-muted-foreground">Chưa có hồ sơ nào được kết luận. Biểu đồ sẽ hiển thị ngay khi bạn đánh giá hồ sơ đầu tiên.</p>}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Tỷ lệ duyệt tin</CardTitle><CardDescription>Tin đã được duyệt trên tổng số tin đã có quyết định (duyệt hoặc từ chối) trong kỳ.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {duyet && <>
              <p className="text-3xl font-bold tracking-tight tabular-nums">{duyet.TyLeDuyet === null || duyet.TyLeDuyet === undefined ? "—" : `${duyet.TyLeDuyet.toLocaleString("vi-VN")}%`}</p>
              {[{ label: "Đã duyệt", value: duyet.DaDuyet, style: STATUS_STYLES[2] }, { label: "Chờ duyệt", value: duyet.ChoDuyet, style: STATUS_STYLES[0] }, { label: "Bị từ chối", value: duyet.TuChoi, style: STATUS_STYLES[3] }].map(row => <div key={row.label}><p className="flex items-center justify-between text-sm"><Badge className={row.style}>{row.label}</Badge><span className="tabular-nums">{row.value}</span></p><Progress className="mt-2" value={Math.max(0, row.value / maxDuyet * 100)} /></div>)}
              {duyet.Nhap > 0 && <p className="text-xs text-muted-foreground">{duyet.Nhap} tin nháp chưa gửi duyệt (không tính vào tỷ lệ).</p>}
            </>}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Top tin nhiều đơn nhất</CardTitle><CardDescription>Các tin nhận nhiều hồ sơ nhất trong kỳ báo cáo.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {report.TopTin.length === 0 && <p className="text-sm text-muted-foreground">Chưa có đơn ứng tuyển nào trong kỳ.</p>}
            {report.TopTin.map(tin => <div key={tin.Id}><p className="flex items-center justify-between gap-3 text-sm"><Link href={`/tin-tuyen-dung/${tin.Id}`} className="truncate font-medium text-foreground hover:underline">{tin.TieuDe}</Link><span className="shrink-0 tabular-nums">{tin.SoLuong} đơn</span></p><Progress className="mt-2" value={Math.max(0, tin.SoLuong / maxTop * 100)} /></div>)}
          </CardContent>
        </Card>
      </div>
    </>}
  </AdminPageLayout>;
}
