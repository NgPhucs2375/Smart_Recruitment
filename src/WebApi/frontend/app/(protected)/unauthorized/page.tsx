import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
        <ShieldX className="size-8 text-destructive" />
      </div>

      <h1 className="text-2xl font-medium tracking-tight text-foreground">
        403 — Không có quyền truy cập
      </h1>

      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Tài khoản của bạn không được phép xem trang này. Vui lòng liên hệ
        quản trị viên nếu bạn cho rằng đây là lỗi.
      </p>

      <div className="mt-8">
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="mr-2 size-4" />
            Quay về Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
