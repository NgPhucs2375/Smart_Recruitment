"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isAdmin } from "./api";

/** Chặn trang admin nếu không phải QUAN_TRI_VIEN. */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setAllowed(isAdmin());
  }, []);

  if (allowed === null) return <div className="p-6 text-muted-foreground">Đang kiểm tra quyền...</div>;
  if (!allowed) {
    return (
      <div className="p-6">
        <Card className="border-destructive max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" /> Không có quyền truy cập
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Khu vực quản trị chỉ dành cho QUAN_TRI_VIEN.</p>
            <Button variant="outline" onClick={() => router.replace("/")}>Về trang chủ</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}
