"use client";

import { useCallback, useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { BarChart3, Briefcase, RefreshCw, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminLoadingState, AdminEmptyState } from "@/components/admin/admin-page-layout";
import { getValidToken } from "@/lib/auth-provider";
import { unwrapResponse } from "@/lib/api/response-contract";

const STATUSES = [{ id: 2, label: "Chờ xử lý" }, { id: 3, label: "Đã xem" }, { id: 5, label: "Phù hợp" }, { id: 6, label: "Từ chối" }, { id: 4, label: "Ứng viên rút đơn" }];
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
  if (identity && !allowed) return <AdminPageLayout><AdminEmptyState icon={BarChart3} title="Báo cáo dành cho nhà tuyển dụng và Admin" description="Tài khoản của bạn không có quyền xem báo cáo tuyển dụng." /></AdminPageLayout>;
  const completed = (report?.outcomes[2] ?? 0) + (report?.outcomes[3] ?? 0);
  const ratio = completed > 0 ? Math.round((report!.outcomes[2] / completed) * 100) : 0;
  return <AdminPageLayout>
    <AdminPageHeader icon={BarChart3} title="Báo cáo và thống kê" description="Số liệu thật từ API, giới hạn theo doanh nghiệp và quyền truy cập của tài khoản." actions={<Button variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw className="size-4" /> Tải lại</Button>} />
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
    {loading ? <AdminLoadingState /> : report && <>
      <div className="grid gap-4 sm:grid-cols-3">{[{ label: "Tin tuyển dụng trong phạm vi", value: report.jobs, icon: Briefcase }, { label: "Đơn ứng tuyển trong phạm vi", value: report.applications, icon: Users }, { label: "Hồ sơ đã đánh giá phù hợp", value: report.outcomes[2], icon: TrendingUp }].map(stat => <AdminCard key={stat.label}><div className="p-5"><p className="flex items-center justify-between text-sm text-muted-foreground">{stat.label}<stat.icon className="size-4" /></p><p className="mt-3 text-2xl font-semibold">{stat.value.toLocaleString("vi-VN")}</p></div></AdminCard>)}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard><AdminCardHeader title="Trạng thái hồ sơ" description="Tổng số theo trạng thái, không bị giới hạn bởi trang dữ liệu đang xem." /><div className="space-y-4 p-5">{STATUSES.map((status, i) => <div key={status.id}><p className="flex justify-between text-sm"><span>{status.label}</span><span>{report.outcomes[i]}</span></p><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(0, report.outcomes[i] / Math.max(1, ...report.outcomes) * 100)}%` }} /></div></div>)}</div></AdminCard>
        <AdminCard><AdminCardHeader title="Tỷ lệ đánh giá phù hợp" description="Tính trên các hồ sơ đã có kết quả phù hợp hoặc từ chối." /><div className="p-5"><p className="text-4xl font-semibold text-primary">{ratio}%</p><p className="mt-3 text-sm text-muted-foreground">{report.outcomes[2]} hồ sơ phù hợp trên {completed} hồ sơ đã được đánh giá.</p></div></AdminCard>
      </div>
    </>}
  </AdminPageLayout>;
}
