import { Suspense } from "react";
import { AdminPageLayout } from "@/components/admin/admin-page-layout";
import { AccountView } from "@/features/account/account-view";

export default function TaiKhoanPage() {
  return (
    <AdminPageLayout>
      <Suspense
        fallback={
          <div className="py-16 text-center text-sm text-muted-foreground">Đang tải...</div>
        }
      >
        <AccountView />
      </Suspense>
    </AdminPageLayout>
  );
}
