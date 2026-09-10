"use client";

import { BarChart3, TrendingUp, Users, Briefcase } from "lucide-react";
import {
  AdminPageLayout,
  AdminPageHeader,
  AdminCard,
  AdminCardHeader,
  AdminEmptyState,
} from "@/components/admin/admin-page-layout";

const mockStats = [
  { label: "Tin tuyển dụng", value: "—", icon: Briefcase },
  { label: "Ứng viên", value: "—", icon: Users },
  { label: "Lượt ứng tuyển", value: "—", icon: TrendingUp },
];

export default function ReportsPage() {
  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={BarChart3}
        title="Báo cáo và thống kê"
        description="Theo dõi hiệu suất hệ thống tuyển dụng và các chỉ số quan trọng."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {mockStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <AdminCard key={stat.label}>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-semibold text-foreground">
                    {stat.value}
                  </span>
                </div>
              </div>
            </AdminCard>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <AdminCardHeader
            title="Xu hướng tuyển dụng"
            description="Thống kê theo thời gian"
          />

          <AdminEmptyState
            icon={BarChart3}
            title="Dữ liệu chưa khả dụng"
            description="Biểu đồ thống kê sẽ hiển thị khi có dữ liệu từ API."
          />
        </AdminCard>

        <AdminCard>
          <AdminCardHeader
            title="Phân tích hiệu suất"
            description="So sánh các chỉ số"
          />

          <AdminEmptyState
            icon={TrendingUp}
            title="Dữ liệu chưa khả dụng"
            description="Báo cáo chi tiết sẽ hiển thị khi có dữ liệu từ API."
          />
        </AdminCard>
      </div>
    </AdminPageLayout>
  );
}
