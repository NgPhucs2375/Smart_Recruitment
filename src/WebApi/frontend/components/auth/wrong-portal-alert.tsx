"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WRONG_PORTAL_CTA, type PortalKind } from "@/lib/portal-roles";

/** Shown after the shared auth API resolves a role that may not enter this portal. Session already cleared. */
export function WrongPortalAlert({ portal }: { portal: PortalKind }) {
  const cta = WRONG_PORTAL_CTA[portal];
  const message =
    portal === "candidate" ? "Đây là tài khoản Nhà tuyển dụng." : "Đây là tài khoản Ứng viên.";
  return (
    <Alert className="border-amber-200 bg-amber-50 py-2.5">
      <AlertTriangle className="size-4 text-amber-600" />
      <AlertDescription className="text-xs text-amber-800">
        <span className="font-semibold">{message}</span>
        <span className="mt-1 block">
          Phiên đăng nhập vừa tạo đã được hủy để bảo vệ tài khoản. Vui lòng dùng đúng cổng.
        </span>
        <Link href={cta.href} className="mt-2 block">
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full rounded-xl border-amber-300 bg-white text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            {cta.label}
            <ArrowRight className="ml-2 size-3.5" />
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
