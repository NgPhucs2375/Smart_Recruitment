"use client";

import { useCallback, useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { BarChart3, Briefcase, Download, RefreshCw, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AdminPageLayout, AdminPageHeader, AdminLoadingState, AdminEmptyState } from "@/components/admin/admin-page-layout";
import { getValidToken } from "@/lib/auth-provider";
import { unwrapResponse } from "@/lib/api/response-contract";

const STATUSES = [{ id: 2, label: "Chờ xử lý" }, { id: 3, label: "Đã xem" }, { id: 5, label: "Phù hợp" }, { id: 6, label: "Từ chối" }, { id: 4, label: "Ứng viên rút đơn" }];

/** Màu Badge định danh chuẩn UX theo trạng thái hồ sơ. */
const STATUS_STYLES = [
  "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
];

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

type Report = { jobs: number; applications: number; outcomes: number[] };

export default function ReportsPage() {
  const { data: identity } = useGetIdentity<{ roles?: string[] }>();
  const allowed = identity?.roles?.some(role => ["QUAN_TRI_VIEN", "NGUOI_DAI_DIEN", "NHAN_SU"].includes(role.toUpperCase())) ?? false;
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true); setError("");
    try {
      const token = await getValidToken();
      const count = async (path: string) => {
        const response = await fetch(`/api/dotnet/${path}`, { cache: "no-store", headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const body = await response.json();
        if (!response.ok) throw new Error(body.Message ?? body.message ?? `HTTP ${response.status}`);
        unwrapResponse(body);
        const total = body.TotalCount ?? body.totalCount;
        if (total == null) throw new Error("API chưa trả tổng số bản ghi cho báo cáo.");
        return Number(total);
      };
      const [jobs, applications, ...outcomes] = await Promise.all([
        count("tintuyendungs?_start=0&_end=1"), count("donungtuyens?_start=0&_end=1"),
        ...STATUSES.map(status => count(`donungtuyens?TrangThai=${status.id}&_start=0&_end=1`)),
      ]);
      setReport({ jobs, applications, outcomes });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không tải được báo cáo."); }
    finally { setLoading(false); }
  }, [allowed]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    const refresh = () => { void load(); };
    window.addEventListener("recruitment:notification", refresh);
    return () => { clearTimeout(timer); window.removeEventListener("recruitment:notification", refresh); };
  }, [load]);

  const exportCsv = useCallback(() => {
    if (!report) {
      toast.error("Chưa có số liệu để xuất.");
      return;
    }
    const rows = [
      ["Chi so", "Gia tri"],
      ["Tin tuyen dung trong pham vi", String(report.jobs)],
      ["Don ung tuyen trong pham vi", String(report.applications)],
      ...STATUSES.map((s, i) => [`Ho so ${s.label}`, String(report.outcomes[i] ?? 0)]),
    ];
    const csv = "﻿" + rows.map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-tuyen-dung-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất báo cáo CSV từ số liệu đang hiển thị.");
  }, [report]);

  if (identity && !allowed) return <AdminPageLayout><AdminEmptyState icon={BarChart3} title="Báo cáo dành cho nhà tuyển dụng và Admin" description="Tài khoản của bạn không có quyền xem báo cáo tuyển dụng." /></AdminPageLayout>;
  const completed = (report?.outcomes[2] ?? 0) + (report?.outcomes[3] ?? 0);
  const ratio = completed > 0 ? Math.round((report!.outcomes[2] / completed) * 100) : 0;
  const maxOutcome = Math.max(1, ...(report?.outcomes ?? [1]));
  return <AdminPageLayout>
    <AdminPageHeader icon={BarChart3} title="Báo cáo và thống kê" description="Số liệu thật từ API, giới hạn theo doanh nghiệp và quyền truy cập của tài khoản." actions={<div className="flex gap-2">
      <Button variant="outline" disabled={loading} onClick={() => void load()}>
        <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Tải lại
      </Button>
      <Button variant="outline" disabled={loading || !report} onClick={exportCsv}>
        <Download className="size-4" /> Xuất CSV
      </Button>
    </div>} />
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
    {loading ? <AdminLoadingState /> : report && <>
      <div className="grid gap-4 sm:grid-cols-3">{[
        { label: "Tin tuyển dụng trong phạm vi", sub: "Đang mở và quản lý", value: report.jobs, icon: Briefcase },
        { label: "Đơn ứng tuyển trong phạm vi", sub: "Mọi trạng thái", value: report.applications, icon: Users },
        { label: "Hồ sơ đã đánh giá phù hợp", sub: "Kết luận Phù hợp", value: report.outcomes[2], icon: TrendingUp },
      ].map(stat => <Card key={stat.label}><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{stat.label}</p><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10"><stat.icon className="size-4 text-primary" /></span></div><p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{stat.value.toLocaleString("vi-VN")}</p><p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p></CardContent></Card>)}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Trạng thái hồ sơ</CardTitle><CardDescription>Tổng số theo trạng thái, không bị giới hạn bởi trang dữ liệu đang xem.</CardDescription></CardHeader>
          <CardContent className="space-y-4">{STATUSES.map((status, i) => <div key={status.id}><p className="flex items-center justify-between text-sm"><Badge className={STATUS_STYLES[i]}>{status.label}</Badge><span className="tabular-nums">{report.outcomes[i]}</span></p><Progress className="mt-2" value={Math.max(0, report.outcomes[i] / maxOutcome * 100)} /></div>)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tỷ lệ đánh giá phù hợp</CardTitle><CardDescription>Tính trên các hồ sơ đã có kết quả phù hợp hoặc từ chối.</CardDescription></CardHeader>
          <CardContent>
            <MatchDonut ratio={ratio} />
            <p className="mt-4 text-sm text-muted-foreground">{report.outcomes[2]} hồ sơ phù hợp trên {completed} hồ sơ đã được đánh giá.</p>
            {completed === 0 && <p className="mt-2 text-xs text-muted-foreground">Chưa có hồ sơ nào được đánh giá — biểu đồ sẽ hiện khi có dữ liệu.</p>}
          </CardContent>
        </Card>
      </div>
    </>}
  </AdminPageLayout>;
}
