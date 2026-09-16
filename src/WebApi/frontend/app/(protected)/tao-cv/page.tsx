"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { TaoCvView } from "@/components/cv/tao-cv-view";

export default function TaoCvPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Đang tải trình tạo CV...
        </div>
      }
    >
      <TaoCvView />
    </Suspense>
  );
}
