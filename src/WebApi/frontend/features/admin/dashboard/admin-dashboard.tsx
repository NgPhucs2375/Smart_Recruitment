"use client";

import { useState } from "react";
import { AlertCircle, Bot, ChartNoAxesCombined, FileSearch, MapPin, ShieldAlert } from "lucide-react";
import { AdminCard, AdminCardHeader, AdminErrorState, AdminLoadingState, AdminPageLayout } from "@/components/admin/admin-page-layout";
import { ActivityFeed } from "./components/activity-feed";
import { DashboardHeader } from "./components/dashboard-header";
import { DonutChart, HorizontalBars, SalaryBars, SkillBars } from "./components/data-charts";
import { GrowthChart } from "./components/growth-chart";
import { MetricCard } from "./components/metric-card";
import { ModerationPanel } from "./components/moderation-panel";
import { RecruitmentFunnel } from "./components/recruitment-funnel";
import { SystemHealth } from "./components/system-health";
import { useAdminDashboard } from "./hooks/use-admin-dashboard";
import type { AdminDashboardData, DashboardPeriod } from "./types/dashboard";

function exportDashboard(data: AdminDashboardData) {
  const rows: (string | number)[][] = [["Nhóm", "Chỉ số", "Giá trị"]];
  data.Summary.forEach((item) => rows.push(["Tổng quan", item.Label, item.Value]));
  data.JobStatus.forEach((item) => rows.push(["Trạng thái tin", item.Name, item.Value]));
  data.ApplicationStatus.forEach((item) => rows.push(["Trạng thái ứng tuyển", item.Name, item.Value]));
  data.UserRoles.forEach((item) => rows.push(["Vai trò", item.Name, item.Value]));
  data.Geography.forEach((item) => rows.push(["Địa điểm ứng viên", item.Name, item.Value]));
  data.SkillDemand.forEach((item) => rows.push(["Kỹ năng", `${item.Name} - nhu cầu`, item.Demand]));
  data.SkillDemand.forEach((item) => rows.push(["Kỹ năng", `${item.Name} - khoảng thiếu`, item.Gap]));
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `hireai-dashboard-${data.PeriodDays}d.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ProcessingPanel({ data }: { data: AdminDashboardData["CvProcessing"] }) {
  const total = data.Successful + data.Failed + data.Pending;
  const rows = [
    { label: "Hoàn thành", value: data.Successful, className: "bg-emerald-500" },
    { label: "Thất bại / hết hạn", value: data.Failed, className: "bg-destructive" },
    { label: "Đang xử lý", value: data.Pending, className: "bg-amber-500" },
  ];
  return <div className="space-y-4">{rows.map((item) => <div key={item.label}>
    <div className="mb-1.5 flex justify-between text-sm"><span className="text-muted-foreground">{item.label}</span><strong className="tabular-nums">{item.value.toLocaleString("vi-VN")} {total > 0 ? `· ${Math.round(item.value * 100 / total)}%` : ""}</strong></div>
    <div className="h-2 rounded-full bg-muted"><div className={`h-full rounded-full ${item.className}`} style={{ width: `${total ? item.value * 100 / total : 0}%` }} /></div>
  </div>)}</div>;
}

export function AdminDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>(30);
  const { data, loading, error, reload } = useAdminDashboard(period);

  return <AdminPageLayout>
    <DashboardHeader
      period={period}
      onPeriodChange={setPeriod}
      onRefresh={reload}
      onExport={() => data && exportDashboard(data)}
      generatedAt={data?.GeneratedAtUtc}
    />

    {loading && !data ? <AdminCard><AdminLoadingState /></AdminCard> : error && !data ? <AdminErrorState message={error} onRetry={reload} /> : data ? <>
      {error && <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><AlertCircle className="size-4" />{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.Summary.map((metric) => <MetricCard key={metric.Key} metric={metric} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8"><GrowthChart points={data.Growth} /></div>
        <AdminCard className="xl:col-span-4">
          <AdminCardHeader title="Cần xử lý" description="Hàng chờ theo trạng thái hiện tại" />
          <div className="p-5"><ModerationPanel moderation={data.Moderation} /></div>
        </AdminCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <AdminCardHeader title="Phễu ứng tuyển" description="Phân bố theo trạng thái hiện tại, không phải lịch sử chuyển bước" />
          <div className="p-5"><RecruitmentFunnel data={data.ApplicationStatus} /></div>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader title="Trạng thái tin tuyển dụng" description="Toàn bộ tin trong hệ thống" />
          <div className="p-5"><DonutChart data={data.JobStatus} centerLabel="Tổng tin" /></div>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader title="Phân bố người dùng" description="Theo vai trò hồ sơ ứng dụng" />
          <div className="p-5"><DonutChart data={data.UserRoles} centerLabel="Hồ sơ" /></div>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader title="Phương thức tạo CV" description="Chỉ tính CV chưa xóa" />
          <div className="p-5"><DonutChart data={data.CvMethods} centerLabel="CV" /></div>
        </AdminCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <AdminCard className="xl:col-span-7">
          <AdminCardHeader title="Địa điểm ứng viên" description="Nhóm theo phần cuối trường địa chỉ tự do" action={<MapPin className="size-5 text-primary" />} />
          <div className="p-5"><HorizontalBars data={data.Geography} /></div>
        </AdminCard>
        <AdminCard className="xl:col-span-5">
          <AdminCardHeader title="Nhóm nghề nổi bật" description="Theo số lượng tin tuyển dụng" />
          <div className="p-5"><HorizontalBars data={data.TopCategories} /></div>
        </AdminCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <AdminCardHeader title="Nhu cầu và khoảng thiếu kỹ năng" description="Tin đang tuyển so với hồ sơ ứng viên có kỹ năng" action={<ChartNoAxesCombined className="size-5 text-primary" />} />
          <div className="p-5"><SkillBars data={data.SkillDemand} /></div>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader title="Mức lương theo nhóm nghề" description="Trung bình trung điểm khoảng lương đã khai báo" />
          <div className="p-5"><SalaryBars data={data.SalaryByCategory} /></div>
        </AdminCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <AdminCard>
          <AdminCardHeader title="Xử lý CV" description="Kết quả parse và phiên import" action={<FileSearch className="size-5 text-primary" />} />
          <div className="p-5"><ProcessingPanel data={data.CvProcessing} /></div>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader title="Recommendation snapshot" description="Kết quả phù hợp mới nhất đang được lưu" action={<Bot className="size-5 text-primary" />} />
          <div className="grid grid-cols-3 gap-3 p-5 text-center">
            <div className="rounded-xl bg-muted/60 p-3"><strong className="block text-xl tabular-nums">{data.Recommendation.Total.toLocaleString("vi-VN")}</strong><span className="text-xs text-muted-foreground">Kết quả</span></div>
            <div className="rounded-xl bg-muted/60 p-3"><strong className="block text-xl tabular-nums">{data.Recommendation.AverageMatchPercent == null ? "N/A" : `${data.Recommendation.AverageMatchPercent}%`}</strong><span className="text-xs text-muted-foreground">Điểm TB</span></div>
            <div className="rounded-xl bg-muted/60 p-3"><strong className="block text-xl tabular-nums">{data.Recommendation.HighMatchCount.toLocaleString("vi-VN")}</strong><span className="text-xs text-muted-foreground">Khớp cao</span></div>
          </div>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader title="Bảo mật tài khoản" description="Trạng thái hiện tại, không phải lịch sử đăng nhập" action={<ShieldAlert className="size-5 text-primary" />} />
          <div className="grid grid-cols-2 gap-3 p-5 text-sm">
            <div className="rounded-xl bg-muted/60 p-3"><span className="text-muted-foreground">Đang khóa</span><strong className="mt-1 block text-xl tabular-nums">{data.Security.LockedAccounts}</strong></div>
            <div className="rounded-xl bg-muted/60 p-3"><span className="text-muted-foreground">Có lần sai</span><strong className="mt-1 block text-xl tabular-nums">{data.Security.AccountsWithFailedAccess}</strong></div>
            <div className="rounded-xl bg-muted/60 p-3"><span className="text-muted-foreground">Chưa xác minh</span><strong className="mt-1 block text-xl tabular-nums">{data.Security.UnconfirmedEmails}</strong></div>
            <div className="rounded-xl bg-muted/60 p-3"><span className="text-muted-foreground">Đã bật 2FA</span><strong className="mt-1 block text-xl tabular-nums">{data.Security.TwoFactorEnabled}</strong></div>
          </div>
        </AdminCard>
      </section>

      <AdminCard>
        <AdminCardHeader title="System health" description="Chỉ gắn trạng thái cho dependency có probe thật" />
        <div className="p-5"><SystemHealth items={data.Health} /></div>
      </AdminCard>

      <section className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <AdminCardHeader title="Hoạt động gần đây" description="Các bản ghi mới nhất, không phải audit log bất biến" />
          <div className="p-5"><ActivityFeed items={data.RecentActivity} /></div>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader title="Giới hạn dữ liệu" description="Các chỉ số chưa thể tính chính xác từ schema hiện tại" />
          <div className="space-y-3 p-5">{data.DataLimitations.map((item) => <div key={item} className="flex gap-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground"><AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" /><p>{item}</p></div>)}</div>
        </AdminCard>
      </section>
    </> : null}
  </AdminPageLayout>;
}
