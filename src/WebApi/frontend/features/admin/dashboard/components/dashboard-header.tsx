import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DashboardPeriod } from "../types/dashboard";

export function DashboardHeader({
  period,
  onPeriodChange,
  onRefresh,
  onExport,
  generatedAt,
}: {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  onRefresh: () => void;
  onExport: () => void;
  generatedAt?: string;
}) {
  return (
    <header className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="size-2 rounded-full bg-primary" /> Admin / Tổng quan
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Hệ sinh thái HIREAI</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Dữ liệu tổng hợp trực tiếp từ hệ thống
            {generatedAt ? ` · cập nhật ${new Date(generatedAt).toLocaleString("vi-VN")}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(period)} onValueChange={(value) => onPeriodChange(Number(value) as DashboardPeriod)}>
            <SelectTrigger className="h-10 w-[142px]" aria-label="Khoảng thời gian">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày</SelectItem>
              <SelectItem value="30">30 ngày</SelectItem>
              <SelectItem value="90">90 ngày</SelectItem>
              <SelectItem value="365">1 năm</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Làm mới dashboard">
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={onExport} className="gap-2">
            <Download className="size-4" /> Xuất CSV
          </Button>
        </div>
      </div>
    </header>
  );
}
