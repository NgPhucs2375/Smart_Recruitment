"use client";

import { ShieldCheck, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  AdminPageLayout,
  AdminPageHeader,
  AdminCard,
  AdminCardHeader,
  AdminEmptyState,
} from "@/components/admin/admin-page-layout";

const mockStats = [
  { label: "Chờ duyệt", value: "—", icon: Clock },
  { label: "Đã duyệt", value: "—", icon: CheckCircle },
  { label: "Từ chối", value: "—", icon: XCircle },
];

export default function RegulatoryRequestsPage() {
  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={ShieldCheck}
        title="Duyệt tin tuyển dụng"
        description="Xét duyệt và quản lý các tin tuyển dụng được đăng trên hệ thống."
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

      <AdminCard>
        <AdminCardHeader
          title="Tin tuyển dụng chờ duyệt"
          description="Danh sách tin tuyển dụng cần xét duyệt"
        />

        <AdminEmptyState
          icon={ShieldCheck}
          title="Chức năng đang được phát triển"
          description="Trang duyệt tin tuyển dụng sẽ sớm khả dụng. Bạn sẽ có thể xem, duyệt và từ chối các tin tuyển dụng từ doanh nghiệp."
        />
      </AdminCard>
    </AdminPageLayout>
  );
}
