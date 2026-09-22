"use client";

import { FileCheck, Receipt, CreditCard, Clock } from "lucide-react";
import {
  AdminPageLayout,
  AdminPageHeader,
  AdminCard,
  AdminCardHeader,
  AdminEmptyState,
} from "@/components/admin/admin-page-layout";

const mockStats = [
  { label: "Tổng hóa đơn", value: "—", icon: Receipt },
  { label: "Đã thanh toán", value: "—", icon: CreditCard },
  { label: "Chờ thanh toán", value: "—", icon: Clock },
];

export default function InvoicesPage() {
  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={FileCheck}
        title="Hóa đơn"
        description="Quản lý hóa đơn và thanh toán của người dùng và doanh nghiệp."
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
          title="Danh sách hóa đơn"
          description="Theo dõi và quản lý các hóa đơn"
        />

        <AdminEmptyState
          icon={FileCheck}
          title="Chức năng đang được phát triển"
          description="Trang quản lý hóa đơn sẽ sớm khả dụng. Bạn sẽ có thể xem, tạo và quản lý hóa đơn từ đây."
        />
      </AdminCard>
    </AdminPageLayout>
  );
}
