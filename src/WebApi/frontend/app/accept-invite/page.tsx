"use client";

import { Suspense } from "react";
import { AcceptInviteView } from "@/features/loi-moi-nhan-su";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Đang tải...</div>}>
      <AcceptInviteView />
    </Suspense>
  );
}
